import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const editFilename = (req, file, callback) => {
  const filename = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
  const extension = path.parse(file.originalname).ext;
  callback(null, `${filename}${extension}`);
};

export const cyrToLat = (str: string): string => {
  const a: Record<string, string> = {};
  a['а'] = 'a';
  a['А'] = 'А';
  a['Б'] = 'B';
  a['б'] = 'b';
  a['В'] = 'V';
  a['в'] = 'v';
  a['Г'] = 'G';
  a['г'] = 'g';
  a['Ґ'] = 'G';
  a['ґ'] = 'g';
  a['Д'] = 'D';
  a['д'] = 'd';
  a['Е'] = 'E';
  a['е'] = 'e';
  a['Ё'] = 'YO';
  a['ё'] = 'yo';
  a['є'] = 'ie';
  a['Є'] = 'Ye';
  a['Ж'] = 'ZH';
  a['ж'] = 'zh';
  a['З'] = 'Z';
  a['з'] = 'z';
  a['И'] = 'I';
  a['и'] = 'i';
  a['І'] = 'I';
  a['і'] = 'i';
  a['ї'] = 'i';
  a['Ї'] = 'Yi';
  a['Й'] = 'I';
  a['й'] = 'i';
  a['К'] = 'K';
  a['к'] = 'k';
  a['Л'] = 'L';
  a['л'] = 'l';
  a['М'] = 'M';
  a['м'] = 'm';
  a['Н'] = 'N';
  a['н'] = 'n';
  a['О'] = 'O';
  a['о'] = 'o';
  a['П'] = 'P';
  a['п'] = 'p';
  a['Р'] = 'R';
  a['р'] = 'r';
  a['С'] = 'S';
  a['с'] = 's';
  a['Т'] = 'T';
  a['т'] = 't';
  a['У'] = 'U';
  a['у'] = 'u';
  a['Ф'] = 'F';
  a['ф'] = 'f';
  a['Х'] = 'H';
  a['х'] = 'h';
  a['Ц'] = 'TS';
  a['ц'] = 'ts';
  a['Ч'] = 'CH';
  a['ч'] = 'ch';
  a['Ш'] = 'SH';
  a['ш'] = 'sh';
  a['Щ'] = 'SCH';
  a['щ'] = 'sch';
  a['Ъ'] = "'";
  a['ъ'] = "'";
  a['Ы'] = 'I';
  a['ы'] = 'i';
  a['Ь'] = "'";
  a['ь'] = "'";
  a['Э'] = 'E';
  a['э'] = 'e';
  a['Ю'] = 'YU';
  a['ю'] = 'yu';
  a['Я'] = 'Ya';
  a['я'] = 'ya';
  return str
    .split('')
    .map((char) => a[char] || char)
    .join('');
};
