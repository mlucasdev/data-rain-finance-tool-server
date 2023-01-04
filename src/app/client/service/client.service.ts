import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRequestService } from 'src/app/budget-request/service/budget-request.service';
import { QuestionService } from 'src/app/question/service/question.service';
import { createUuid } from 'src/app/util/create-uuid';
import { CreateClienteResponse } from '../protocols/create-client-response';
import { FindAllClientsResponse } from '../protocols/find-all-clients-response';
import { FindClientByIdResponse } from '../protocols/find-client-by-id-response';
import { DbCreateClientResponsesProps } from '../protocols/props/db-create-client-responses.props';
import { ClientRepository } from '../repositories/client.repository';
import { ClientResponse, ClientResponsesDto } from './dto/client-responses.dto';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly budgetRequestService: BudgetRequestService,
    private readonly questionService: QuestionService,
  ) {}

  async createClient(dto: CreateClientDto): Promise<CreateClienteResponse> {
    dto.name = dto.name.trim();
    dto.companyName = dto.companyName.toLowerCase().trim();
    dto.phone = dto.phone.replace(/\s/g, '').replace(/[^0-9]/g, '');

    const clientOrNull = await this.clientRepository.findClientByCompanyName(
      dto.companyName,
    );

    if (clientOrNull) {
      return {
        id: clientOrNull.id,
        companyName: clientOrNull.companyName,
      };
    }

    const clientCreated = await this.clientRepository.createClient({
      ...dto,
      id: createUuid(),
    });
    return {
      id: clientCreated.id,
      companyName: clientCreated.companyName,
    };
  }

  async createClientResponses(dto: ClientResponsesDto) {
    const responses: ClientResponse[] = dto.responses;
    const questionIds = responses.map((response) => response.questionId);
    const alternativeIds = responses.map((response) => response.alternativeId);
    const questionDuplicate = this.hasDuplicates(questionIds);
    const alternativeDuplicate = this.hasDuplicates(alternativeIds);
    if (questionDuplicate || alternativeDuplicate) {
      throw new BadRequestException(
        `Question Id or Alternative Id cannot be dubbed`,
      );
    }

    await this.verifyClientExist(dto.clientId);

    for (const response of responses) {
      if (!response.alternativeId && !response.responseDetails) {
        throw new BadRequestException(`Altarnative id or details required`);
      }
      await this.questionService.veryfiQuestionExist(response.questionId);
      await this.questionService.verifyRelationshipBetweenQuestionAndAlternative(
        {
          questionId: response.questionId,
          alternativeId: response.alternativeId,
        },
      );
    }

    const budgetRequestCreated =
      await this.budgetRequestService.createBudgetRequest({
        clientId: dto.clientId,
      });

    const data: DbCreateClientResponsesProps[] = responses.map((response) => ({
      ...response,
      id: createUuid(),
      budgetRequestId: budgetRequestCreated.id,
    }));

    return await this.clientRepository.createClientResponses(data);
  }

  async findAllClients(): Promise<FindAllClientsResponse[]> {
    const clientsOrEmpty = await this.clientRepository.findAllClients();
    if (!clientsOrEmpty || clientsOrEmpty.length === 0) {
      throw new NotFoundException('Clients not found');
    }
    return clientsOrEmpty;
  }

  async findClientById(id: string): Promise<FindClientByIdResponse> {
    const clientOrNull = await this.clientRepository.findClientById(id);
    if (!clientOrNull) {
      throw new NotFoundException(`Client with id '${id}' not found`);
    }

    clientOrNull.budgetRequests.forEach((budgetRequest) => {
      delete Object.assign(budgetRequest, {
        ['formResponses']: budgetRequest['clientsResponses'],
      })['clientsResponses'];
    });

    return clientOrNull;
  }

  async deleteClientById(id: string): Promise<void> {
    await this.verifyClientExist(id);
    await this.clientRepository.deleteClientById(id);
  }

  async verifyClientExist(id: string) {
    const clientOrNull = await this.clientRepository.findClientById(id);
    if (!clientOrNull) {
      throw new BadRequestException(`Client with id '${id}' not found`);
    }
    return null;
  }

  hasDuplicates(array: string[]): Boolean {
    return new Set(array).size !== array.length;
  }
}
