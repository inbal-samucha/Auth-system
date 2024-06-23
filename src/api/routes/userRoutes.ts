import express, { Request, Response } from 'express';

import { User } from '../../db/models/User';
import BadRequestError from '../../errors/BadRequestError';

const userRoutes = express.Router();

userRoutes.patch('/update', async (req: Request, res: Response) => {

    const { phone, firstName, lastName } = req.body;

    const user = await User.findOne({ 
      where: { id: req.userId },
      attributes: { exclude: ['refreshToken', 'password', 'resetToken', 'resetTokenExpiration']}
    });

    if (!user) {
      throw new BadRequestError({ code: 400, message: "Invalid user", logging: true });
    }

    if (phone) user.phone = phone;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();
  
    res.send(user);

});

export { userRoutes };