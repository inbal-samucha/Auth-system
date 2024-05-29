import { Request, Response, NextFunction } from "express"

import { CustomError } from "../../../errors/CustomError";


export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if(err instanceof CustomError){
    const { statusCode, errors, logging } = err;

    if(logging){
      console.log(JSON.stringify({
        code: statusCode,
        errors,
        stack: err.stack
      }, null, 2));
      

      return res.status(statusCode).send({ errors })
    }
  }

   console.error(JSON.stringify(err, null, 2));
  res.status(500). send({ errors: [{ message: 'Something went worng'}]});
}