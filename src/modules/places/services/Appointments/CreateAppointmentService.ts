import { injectable, inject, container } from 'tsyringe';
import path from 'path';
import IMailProvider from '@shared/container/Providers/MailProvider/models/IMailProvider';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IScoreRepository from '@modules/score/repositories/IScoreRepository';
import AppError from '@shared/errors/AppError';
import Appointment from '../../infra/typeorm/entities/Appointments/Appointment';
import ICreateAppointmentDTO from '../../dtos/Appointments/ICreateAppointmentDTO';
import IAppointmentsRepository from '../../repositories/Appointments/IAppointmentsRepository';
import IPlacesRepository from '../../repositories/Places/IPlacesRepository';

import verifyAppointmentExistsInSameHour from './methods/verifyAppointmentExistsInSameHour';
import sendNotification from './methods/sendNotification';
import buildEmailText from './methods/buildEmailText';

import InsertAppointmentPointsService from './InsertAppointmentPointsService';

import white_label from '../../../../white_label';

@injectable()
class CreateAppointmentservice {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
    @inject('MailProvider')
    private mailProvider: IMailProvider,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('PlacesRepository')
    private placesRepository: IPlacesRepository,
    @inject('ScoreRepository')
    private scoreRepository: IScoreRepository,
  ) {}

  public async execute(data: ICreateAppointmentDTO): Promise<Appointment[]> {
    const insertAppointmentPointsService = container.resolve(
      InsertAppointmentPointsService,
    );
    try {
      const { id_user } = data.appointment;

      let pointsInserted = false;

      const appointmentsToReturn: Appointment[] = [];

      const adminUsers = await this.usersRepository.findAllAdminUsers();

      const { hours, appointment, materials } = data;

      const modules = await this.scoreRepository.findAllModules();

      const place = await this.placesRepository.findById(appointment.id_place);
      let userPoints = 0;
      if (id_user > '') {
        userPoints = await this.scoreRepository.findUserPoints(id_user);
      }

      const appointmentsInMonth =
        await this.appointmentsRepository.findAllInMonth(
          new Date(hours[0].start_date).getMonth() + 1,
        );

      const duplicateAppointment = verifyAppointmentExistsInSameHour(
        hours,
        appointmentsInMonth,
      );

      hours.map(async item => {
        if (!duplicateAppointment) {
          const newAppointment =
            await this.appointmentsRepository.createAppointmentHour(
              item,
              appointment,
            );

          if (appointment.id_user > '') {
            await this.appointmentsRepository.createAppointmentUser(
              newAppointment.id,
              appointment.id_user,
            );
          }
          if (!pointsInserted && white_label().isUsingScore) {
            await insertAppointmentPointsService.execute({
              id_user,
              appointmentFinalPrice: appointment.priceToPay,
              userPoints,
              winningPoints: appointment.winningPoints,
              usingPoints: appointment.points,
              id_module: modules.filter(i => i.name === 'Reservas Avulsas')[0]
                .id,
            });
            pointsInserted = true;
          }

          appointmentsToReturn.push(newAppointment);

          if (materials && materials.length > 0) {
            const filteredMaterials = materials.filter(
              material => material.id_hour === item.id,
            );

            filteredMaterials.map(async item2 => {
              await this.appointmentsRepository.createAppointmentMaterial(
                item2,
                newAppointment.id,
              );
            });
          }
        }
      });

      if (duplicateAppointment) {
        throw new AppError('Appointment already exists');
      }

      if (String(process.env.NOTIFICATION) === 'YES') {
        sendNotification(adminUsers, hours, appointment, materials, place);
      }

      // if (white_label().sendAppointmentCreatedEmail) {
      //   if (appointment.finalPrice > 0) {
      //     const emailText = buildEmailText(hours, materials);

      //     const appointmentCreatedTemplate = path.resolve(
      //       __dirname,
      //       '..',
      //       '..',
      //       '..',
      //       '..',
      //       'emails',
      //       'AppointmentCreated',
      //       `${process.env.CLIENT}.hbs`,
      //     );
      //     if (appointment.paid) {
      //       await this.mailProvider.sendMail({
      //         to: {
      //           name: appointment.user_name,
      //           email: appointment.email,
      //         },
      //         subject: 'Reserva concluída com sucesso!',
      //         templateData: {
      //           file: appointmentCreatedTemplate,
      //           variables: {
      //             text: emailText,
      //           },
      //         },
      //       });
      //     }
      //   }
      // }

      return appointmentsToReturn;
    } catch (error) {
      console.log(error);
      throw new Error();
    }
  }
}

export default CreateAppointmentservice;
