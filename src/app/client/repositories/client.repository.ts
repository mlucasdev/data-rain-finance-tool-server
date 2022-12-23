import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/app/infra/prisma/prisma.service';
import { serverError } from 'src/app/util/server-error';
import { ClientEntity } from '../entities/client.entity';
import { DbCreateClientProps } from '../protocols/props/db-create-client-props';
import { DbCreateClientResponsesProps } from '../protocols/props/db-create-client-responses.props';

@Injectable()
export class ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(data: DbCreateClientProps): Promise<ClientEntity> {
    const clientCreated = await this.prisma.clients
      .create({ data })
      .catch(serverError);
    return clientCreated;
  }

  async findClientByCompanyName(companyName: string): Promise<ClientEntity> {
    const clientOrNull = await this.prisma.clients
      .findUnique({ where: { companyName } })
      .catch(serverError);
    return clientOrNull;
  }

  async findClientById(id: string): Promise<ClientEntity> {
    const clientOrNull = await this.prisma.clients
      .findUnique({ where: { id } })
      .catch(serverError);

    return clientOrNull;
  }

  async createClientResponses(
    props: DbCreateClientResponsesProps[],
  ): Promise<void> {
    try {
      const data: Prisma.Enumerable<Prisma.ClientsResponsesCreateManyInput> =
        props.map((response) => ({ ...response }));
      await this.prisma.clientsResponses.createMany({ data });
    } catch (error) {
      if (error.meta.field_name) {
        const result = error.meta.field_name.split(' ');
        if (result[0] === 'clients_responses_question_id_fkey') {
          throw new BadRequestException('Some question id is incorrect');
        }
        if (result[0] === 'clients_responses_alternative_id_fkey') {
          throw new BadRequestException('Some alternative id is incorrect');
        }
      }
      return serverError(error);
    }
  }
}
