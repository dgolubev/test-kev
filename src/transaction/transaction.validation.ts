import * as Joi from 'joi';

const transactionBodySchema = Joi.object({
  date: Joi.date().required(),
  amount: Joi.number().required(),
  currency: Joi.string().length(3).required(),
  client_id: Joi.number().required(),
});

export { transactionBodySchema };
