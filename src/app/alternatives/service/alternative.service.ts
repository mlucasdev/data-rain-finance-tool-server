import { BadRequestException, Injectable } from '@nestjs/common';
import { QuestionRepository } from 'src/app/question/repositories/question.repository';
import { TeamService } from 'src/app/team/service/team.service';
import { createUuid } from 'src/app/util/create-uuid';
import { AlternativeEntity } from '../entities/alternative.entity';
import { CreateAlternativeResponse } from '../protocols/create-alternative-response';
import { UpdateAlternativeResponse } from '../protocols/update-alternative-response';
import { AlternativeRepository } from '../repositories/alternative.repository';
import { CreateAlternativeDto } from './dto/create-alternative.dto';
import { UpdateAlternativeDto } from './dto/update-alternative.dto';

@Injectable()
export class AlternativeService {
  constructor(
    private readonly alternativeRepository: AlternativeRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly teamService: TeamService,
  ) {}

  async createAlternative(
    dto: CreateAlternativeDto,
  ): Promise<CreateAlternativeResponse> {
    const questionOrNull = await this.questionRepository.findQuestionById(
      dto.questionId,
    );
    if (!questionOrNull) {
      throw new BadRequestException(
        `Question with id '${dto.questionId}' not found`,
      );
    }

    for (const team of dto.teams) {
      await this.teamService.verifyTeamExist(team.teamId);
    }

    const alternative = await this.alternativeRepository.createAlternative({
      ...dto,
      id: createUuid(),
    });

    const data = dto.teams.map((team) => ({
      alternativeId: alternative.id,
      teamId: team.teamId,
      workHours: team.workHours,
    }));

    const alternativesTeams =
      await this.alternativeRepository.createAlternativesTeams(data);

    console.log(alternativesTeams);

    return {
      id: alternative.id,
      description: alternative.description,
      questionId: alternative.questionId,
    };
  }

  async updateAlternative(
    id: string,
    dto: UpdateAlternativeDto,
  ): Promise<UpdateAlternativeResponse> {
    await this.verifyAlternativeExist(id);
    const alternativeUpdated =
      await this.alternativeRepository.updateAlternativeById(id, dto);

    return {
      id: alternativeUpdated.id,
      description: alternativeUpdated.description,
      questionId: alternativeUpdated.questionId,
    };
  }

  async deleteAlternativeById(id: string): Promise<void> {
    await this.verifyAlternativeExist(id);
    await this.alternativeRepository.deleteAlternativeById(id);
  }

  async verifyAlternativeExist(id: string): Promise<AlternativeEntity> {
    const alternativeOrNull =
      await this.alternativeRepository.findAlternativeById(id);

    if (!alternativeOrNull) {
      throw new BadRequestException(`Alternative with id '${id}' not found`);
    }
    return alternativeOrNull;
  }
}
