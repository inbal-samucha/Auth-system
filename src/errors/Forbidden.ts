import { CustomError } from "./CustomError";

export default class Forbidden extends CustomError {
  private static readonly _statusCode = 403;
  private readonly _code: number;
  private readonly _logging: boolean;
  private readonly _context: {[key: string]: any}

  constructor(params?: {code?: number, message?: string, logging?: boolean, context?: {[key:string]: any}}){
    const { code, message, logging } = params || {};

    super(message || 'Forbidden');
    this._code = code || Forbidden._statusCode;
    this._logging = logging || false;
    this._context = params?.context || {}; 

    Object.setPrototypeOf(this, Forbidden.prototype);
  }

  get errors(){
    return [{ message: this.message, context: this._context}];
  }

  get logging(){
    return this._logging;
  }

  get statusCode(){
    return this._code;
  }
}