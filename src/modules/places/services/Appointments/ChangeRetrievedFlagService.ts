import { injectable, inject } from 'tsyringe';

import Appointment from '../../infra/typeorm/entities/Appointments/Appointment';
import IAppointmentsRepository from '../../repositories/Appointments/IAppointmentsRepository';

@injectable()
class ChangeRetrievedFlagService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
  ) {}

  public async execute(id_appointment: string): Promise<Appointment> {
    const appointment =
      await this.appointmentsRepository.handleChangeRetrievedFlag(
        id_appointment,
      );

    return appointment;
  }
}

export default ChangeRetrievedFlagService;
