import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Res } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { FastifyReply } from 'fastify';

@Controller('scores')
export class ScoresController {
  constructor(
    private readonly scoresService: ScoresService
  ) { }

  @Post()
  create(@Res() response: FastifyReply, @Body() createScoreDto: any) {
    try {
      // let confidence_scoresArr = [];

      // createScoreDto.output[0].nBestTokens.forEach(element => {
      //   element.tokens.forEach(token => {
      //     let tokenArr = Object.entries(token);
      //     for (let [key, value] of tokenArr) {
      //       let score: any = value
      //       let identification_status = 0;
      //       if (score >= 0.90) {
      //         identification_status = 1;
      //       } else if (score >= 0.40) {
      //         identification_status = -1;
      //       } else {
      //         identification_status = 0;
      //       }

      //       confidence_scoresArr.push(
      //         {
      //           token: key,
      //           hexcode: "temp",
      //           confidence_score: value,
      //           identification_status: identification_status
      //         }
      //       );
      //     }
      //   });
      // });

      // console.log(confidence_scoresArr);

      // let createScoreData = {
      //   user_id: createScoreDto.user_id,
      //   session: {
      //     session_id: createScoreDto.session_id,
      //     date: createScoreDto.date,
      //     original_text: createScoreDto.original_text,
      //     response_text: createScoreDto.response_text,
      //     confidence_scores: confidence_scoresArr
      //   }
      // };
      // console.log(createScoreData);
      // let data = this.scoresService.create(createScoreData);

      let originalText = createScoreDto.original_text;
      let responseText = createScoreDto.output[0].source;

      let responseTextWordsArr = responseText.split(" ");
      let originalTextWordsArr = originalText.split(" ");
      let incorrectTokens = [];
      let correctTokens = [];
      let missingTokens = [];
      let wordTokensMap = [];

      if (originalText !== responseText) {
        for (let [originalTextWordsIndex, originalTextWordsArrELE] of originalTextWordsArr.entries()) {
          let originalTextWordToken = originalTextWordsArrELE.split("");
          let responseTextWordToken = responseTextWordsArr[originalTextWordsIndex].split("");

          missingTokens = originalTextWordToken.filter((originalTextWordTokenEle) => {
            if (!responseTextWordToken.includes(originalTextWordTokenEle)) {
              return originalTextWordTokenEle;
            } else {
              return false;
            }
          })

          wordTokensMap = originalTextWordToken.map((originalTextWordTokenEle) => {
            if (responseTextWordToken.includes(originalTextWordTokenEle)) {
              return originalTextWordTokenEle;
            } else {
              return 'wrong/missing';
            }
          })

          correctTokens = originalTextWordToken.filter((originalTextWordTokenEle) => {
            if (responseTextWordToken.includes(originalTextWordTokenEle)) {
              return originalTextWordTokenEle;
            } else {
              return false;
            }
          })

          for (let responseTextWordTokenEle of responseTextWordToken) {
            if (!originalTextWordToken.includes(responseTextWordTokenEle)) {
              incorrectTokens.push(responseTextWordTokenEle);
            }
          }
        }
      }


      return response.status(HttpStatus.CREATED).send({ status: 'success', missingTokens: missingTokens, incorrectTokens: incorrectTokens, correctTokens: correctTokens, wordTokensMap: wordTokensMap, responseTextWordsArr: responseTextWordsArr[0].split(""), originalTextWordsArr: originalTextWordsArr[0].split("") })
    } catch (err) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        status: "error",
        message: "Server error - " + err
      });
    }
  }

  @Post('/bulk')
  createBulk(@Res() response: FastifyReply, @Body() createScoreDto: any) {
    try {
      let data = this.scoresService.create(createScoreDto);
      return response.status(HttpStatus.CREATED).send({ status: 'success', msg: 'Successfully Added' })
    } catch (err) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        status: "error",
        message: "Server error - " + err
      });
    }
  }

  @Get()
  findAll() {
    return this.scoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scoresService.findOne(+id);
  }

  @Get('/byuser/:id')
  findbyUser(@Param('id') id: string) {
    return this.scoresService.findbyUser(id);
  }

  @Get('/bysession/:id')
  findbySession(@Param('id') id: string) {
    return this.scoresService.findbySession(id);
  }

  @Get('/GetGaps/session/:sessionId')
  GetGapsbySession(@Param('sessionId') id: string) {
    return this.scoresService.getGapBySession(id);
  }

  @Get('/GetGaps/user/:userId')
  GetGapsbyUser(@Param('userId') id: string) {
    return this.scoresService.getGapByUser(id);
  }

  @Get('/GetRecommendedWords/session/:sessionId')
  GetRecommendedWordBysession(@Param('sessionId') id: string) {
    return this.scoresService.getRecommendedWordsBySession(id);
  }

  @Get('/GetRecommendedWords/user/:userId')
  GetRecommendedWordByUser(@Param('userId') id: string) {
    return this.scoresService.getRecommendedWordsByUser(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScoreDto: UpdateScoreDto) {
    return this.scoresService.update(+id, updateScoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scoresService.remove(+id);
  }
}
