import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { differenceInMinutes, addHours, format } from 'date-fns';
import keys from '@modules/payments/keys';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import WhatsAppNotification from '@modules/places/providers/WhatsAppNotification';
import IAppointmentsRepository from '../../../repositories/Appointments/IAppointmentsRepository';

@injectable()
class SchedulePixPaymentService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(): Promise<void> {
    const adminUsers = await this.usersRepository.findAllAdminUsers();

    const appointments =
      await this.appointmentsRepository.findAllUnpaidAppointments();
    const hoursToAdd = 0;

    appointments.map(async item => {
      if (
        differenceInMinutes(new Date(), addHours(item.created_at, hoursToAdd)) >
        10
      ) {
        // await this.appointmentsRepository.deleteAppointment(item.id);
      } else {
        axios
          .get(
            `https://app.vindi.com.br/api/v1/charges/${item.id_transaction}`,
            {
              auth: {
                username: keys().production_private_key,
                password: '',
              },
            },
          )
          .then(response => {
            if (String(response.data.charge.status) !== 'paid') {
              this.appointmentsRepository.updatePaidAppointment(item.id);
              const start_date = `Início: ${format(
                new Date(item.start_date),
                'dd/MM/yyyy HH:mm',
              )}`;
              const finish_date = `Fim: ${format(
                new Date(item.finish_date),
                'dd/MM/yyyy HH:mm',
              )}`;
              const title = `Nova Reserva - ${item.observation.replace(
                ' - App',
                '',
              )}`;

              let notificationMessage = `${start_date}\n${finish_date}`;
              if (item.amount > 0) {
                notificationMessage += `\n\nMateriais:\n- ${item.material}: ${item.amount}`;
              }

              adminUsers.map(i => {
                WhatsAppNotification(
                  i.cellphone,
                  `${title}\n${notificationMessage}`,
                );
                return null;
              });
            }
          })
          .catch();
      }
    });
  }
}

export default SchedulePixPaymentService;
