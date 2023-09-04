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
      let confidence_scoresArr = [];
      let anomaly_scoreArr = [];

      let originalText = createScoreDto.original_text;
      let responseText = createScoreDto.output[0].source;

      let originalTextTokensArr = originalText.split("");
      let responseTextTokensArr = responseText.split("");
      let incorrectTokens = [];
      let correctTokens = [];
      let missingTokens = [];
      // let wordTokensMap = [];
      let vowelSignArr = [
        "ா",
        "ி",
        "ீ",
        "ு",
        "ூ",
        "ெ",
        "ே",
        "ை",
        "ொ",
        "ோ",
        "ௌ",
        "்",
      ];

      if (originalText !== responseText) {

        let compareCharArr = [];

        for (let sourceEle of originalText.split(" ")) {

          for (let originalEle of responseText.split(" ")) {
            if (similarity(originalEle, sourceEle) >= 0.40) {
              compareCharArr.push({ originalEle: originalEle, sourceEle: sourceEle, score: similarity(originalEle, sourceEle) });
              //break;
            }
          }
        }

        function similarity(s1, s2) {
          var longer = s1;
          var shorter = s2;
          if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
          }
          var longerLength = longer.length;
          if (longerLength == 0) {
            return 1.0;
          }
          return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
        }

        function editDistance(s1, s2) {
          s1 = s1.toLowerCase();
          s2 = s2.toLowerCase();

          var costs = new Array();
          for (var i = 0; i <= s1.length; i++) {
            var lastValue = i;
            for (var j = 0; j <= s2.length; j++) {
              if (i == 0)
                costs[j] = j;
              else {
                if (j > 0) {
                  var newValue = costs[j - 1];
                  if (s1.charAt(i - 1) != s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue),
                      costs[j]) + 1;
                  costs[j - 1] = lastValue;
                  lastValue = newValue;
                }
              }
            }
            if (i > 0)
              costs[s2.length] = lastValue;
          }
          return costs[s2.length];
        }

        console.log(compareCharArr);


        for (let [originalTextWordsIndex, originalTextWordsArrELE] of compareCharArr.entries()) {
          let originalTextWordToken = [];
          let responseTextWordToken = [];

          let prevEle = '';
          let isPrevVowel = false;

          for (let originalTextELE of originalTextWordsArrELE['originalEle'].split("")) {

            if (vowelSignArr.includes(originalTextELE)) {
              if (isPrevVowel) {
                let prevEleArr = prevEle.split("");
                prevEle = prevEleArr[0] + originalTextELE;
                originalTextWordToken.push(prevEle);
              } else {
                prevEle = prevEle + originalTextELE;
                originalTextWordToken.push(prevEle);
              }
              isPrevVowel = true;
            } else {
              originalTextWordToken.push(originalTextELE);
              prevEle = originalTextELE;
              isPrevVowel = false;
            }
          }

          prevEle = '';
          isPrevVowel = false;

          for (let responseTextWordTokenELE of originalTextWordsArrELE['sourceEle'].split("")) {
            if (vowelSignArr.includes(responseTextWordTokenELE)) {
              if (isPrevVowel) {
                let prevEleArr = prevEle.split("");
                prevEle = prevEleArr[0] + responseTextWordTokenELE;
                responseTextWordToken.push(prevEle);
              } else {
                prevEle = prevEle + responseTextWordTokenELE;
                responseTextWordToken.push(prevEle);
              }
              isPrevVowel = true;
            } else {
              responseTextWordToken.push(responseTextWordTokenELE);
              prevEle = responseTextWordTokenELE;
              isPrevVowel = false;
            }
          }

          let newmissingTokens = originalTextWordToken.filter((originalTextWordTokenEle) => {
            if (!responseTextWordToken.includes(originalTextWordTokenEle)) {
              return originalTextWordTokenEle;
            } else {
              return false;
            }
          })

          missingTokens.push.apply(missingTokens, Array.from(new Set(newmissingTokens)));

          // wordTokensMap = originalTextWordToken.map((originalTextWordTokenEle) => {
          //   if (responseTextWordToken.includes(originalTextWordTokenEle)) {
          //     return originalTextWordTokenEle;
          //   } else {
          //     return 'wrong/missing';
          //   }
          // })

          let newCorrectTokens = originalTextWordToken.filter((originalTextWordTokenEle) => {
            if (responseTextWordToken.includes(originalTextWordTokenEle)) {
              return originalTextWordTokenEle;
            } else {
              return false;
            }
          })

          correctTokens.push.apply(correctTokens, Array.from(new Set(newCorrectTokens)));

          for (let responseTextWordTokenEle of responseTextWordToken) {
            if (!originalTextWordToken.includes(responseTextWordTokenEle)) {
              incorrectTokens.push(responseTextWordTokenEle);
            }
          }
        }
      } else {
        let prevEle = '';
        let isPrevVowel = false;
        for (let responseTextTokensArrEle of responseTextTokensArr) {
          if (responseTextTokensArrEle != "") {
            if (vowelSignArr.includes(responseTextTokensArrEle)) {
              if (isPrevVowel) {
                let prevEleArr = prevEle.split("");
                prevEle = prevEleArr[0] + responseTextTokensArrEle;
                correctTokens.push(prevEle);
              } else {
                prevEle = prevEle + responseTextTokensArrEle;
                correctTokens.push(prevEle);
              }
              isPrevVowel = true;
            } else {
              correctTokens.push(responseTextTokensArrEle);
              prevEle = responseTextTokensArrEle;
              isPrevVowel = false;
            }
          }
        }
      }

      let filteredTokenArr = [];

      //token list for ai4bharat response
      let tokenArr = [];

      createScoreDto.output[0].nBestTokens.forEach(element => {
        element.tokens.forEach(token => {
          tokenArr.push(...Object.entries(token));
        });
      });

      let uniqueChar = new Set();
      let prevEle = '';
      let isPrevVowel = false;

      for (let [tokenArrEle, tokenArrEleVal] of tokenArr) {
        for (let keyEle of tokenArrEle.split("")) {
          if (vowelSignArr.includes(keyEle)) {
            if (isPrevVowel) {
              let prevEleArr = prevEle.split("");
              prevEle = prevEleArr[0] + keyEle;
              uniqueChar.add(prevEle);
            } else {
              prevEle = prevEle + keyEle;
              uniqueChar.add(prevEle);
            }
            isPrevVowel = true;
          } else {
            uniqueChar.add(keyEle);
            isPrevVowel = false;
            prevEle = keyEle
          }
        }
      }

      //unique token list for ai4bharat response
      let uniqueCharArr = Array.from(uniqueChar);

      isPrevVowel = false;

      for (let char of uniqueCharArr) {
        let score = 0.0;
        let prevChar = '';
        let isPrevVowel = false;

        for (let [key, value] of tokenArr) {

          for (let keyEle of key.split("")) {
            let scoreVal: any = value;
            let charEle: any = keyEle;

            if (vowelSignArr.includes(charEle)) {
              if (isPrevVowel) {
                let prevCharArr = prevChar.split("");
                prevChar = prevCharArr[0] + charEle;
                charEle = prevChar;
              } else {
                prevChar = prevChar + charEle;
                charEle = prevChar;
              }
              isPrevVowel = true;
            } else {
              prevChar = charEle;
              isPrevVowel = false;
            }



            if (char === charEle) {
              if (scoreVal > score) {
                score = scoreVal;
              }
            }
          }
        }

        filteredTokenArr.push({ charkey: char, charvalue: score });
      }

      for (let value of filteredTokenArr) {
        let score: any = value.charvalue

        let identification_status = 0;
        if (score >= 0.90) {
          identification_status = 1;
        } else if (score >= 0.40) {
          identification_status = -1;
        } else {
          identification_status = 0;
        }

        if (value.charkey !== "" && value.charkey !== "▁") {
          if (incorrectTokens.includes(value.charkey) || correctTokens.includes(value.charkey)) {
            confidence_scoresArr.push(
              {
                token: value.charkey,
                hexcode: value.charkey.charCodeAt(0).toString(16),
                confidence_score: incorrectTokens.includes(value.charkey) && !correctTokens.includes(value.charkey) ? 0.10 : value.charvalue,
                identification_status: incorrectTokens.includes(value.charkey) ? 0 : identification_status
              }
            );
          } else {

            if (!originalTextTokensArr.join('').includes(value.charkey) && !responseTextTokensArr.join('').includes(value.charkey)) {
              anomaly_scoreArr.push(
                {
                  token: value.charkey,
                  hexcode: value.charkey.charCodeAt(0).toString(16),
                  confidence_score: 0.10,
                  identification_status: 0
                }
              );
            } else {
              confidence_scoresArr.push(
                {
                  token: value.charkey,
                  hexcode: value.charkey.charCodeAt(0).toString(16),
                  confidence_score: 0.10,
                  identification_status: 0
                }
              );
            }
          }
        }
      }

      let createScoreData = {
        user_id: createScoreDto.user_id,
        session: {
          session_id: createScoreDto.session_id,
          date: createScoreDto.date,
          original_text: createScoreDto.original_text,
          response_text: responseText,
          confidence_scores: confidence_scoresArr,
          anamolydata_scores: anomaly_scoreArr
        }
      };

      let data = this.scoresService.create(createScoreData);



      return response.status(HttpStatus.CREATED).send({ status: 'success', missingTokens: missingTokens, incorrectTokens: incorrectTokens, correctTokens: correctTokens, confidence_scoresArr: confidence_scoresArr, anomaly_scoreArr: anomaly_scoreArr, uniqueCharArr: uniqueCharArr })
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
