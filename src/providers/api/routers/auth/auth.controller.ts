import { NextFunction, Request, Response } from 'express';
import { hash } from 'bcrypt';	
import { sign } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { PrismaClientAdapter } from '../../../../adapters/PrismaClientAdapter';
import { PrismaClient } from "@prisma/client";

const prismaAdapter = new PrismaClientAdapter();

const prisma = new PrismaClient();

const tokenSecret = process.env.SECRET;

type User = {
  id: number;
  email: string;
  password: string;
}

const singUp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, name, username, number, role } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    
    if (userExists) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    const hash_password = await hash(password, 8);

    const user = await prismaAdapter.create('User', {
      data: {
        name,
        username,
        email,
        password: hash_password,
        number,
        role
      }
    });
    res.status(200  ).json({ user });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

const login = async (req: Request, res: Response): Promise<any> => {
  console.log('BODY', req.body);
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = sign({ id: user.id }, tokenSecret as string, {
      expiresIn: '1d'
    });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

export const authController = {
  login,
  singUp
};