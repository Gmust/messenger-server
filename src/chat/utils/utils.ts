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
