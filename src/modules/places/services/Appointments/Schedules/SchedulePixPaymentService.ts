import { injectable, inject } from 'tsyringe';
import { differenceInMinutes, addHours } from 'date-fns';
import IAppointmentsRepository from '../../../repositories/Appointments/IAppointmentsRepository';

@injectable()
class SchedulePixPaymentService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
  ) {}

  public async execute(): Promise<void> {
    try {
      const appointments =
        await this.appointmentsRepository.findUnpaidAppointments();

      appointments.forEach(async i => {
        const hoursToAdd = -3;

        const minutesDifference = differenceInMinutes(
          new Date(),
          new Date(addHours(i.created_at, hoursToAdd)),
        );

        if (i.observation === 'Pedro Campos Carvalho - App') {
          console.log(`Criado em: ${i.created_at}`);
          console.log(`Data Atual: ${new Date()}`);
          console.log(minutesDifference);
        }

        if (!i.paid && !i.canceled) {
          if (minutesDifference >= 10) {
            i.canceled = true;
            i.observation = `${i.observation} - Cancelado por falta de pagamento`;
            // this.appointmentsRepository.save(i);
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default SchedulePixPaymentService;
