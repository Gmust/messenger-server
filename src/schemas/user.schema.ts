import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';


export type UserDocument = User & Document

@Schema()
export class User {
  @Prop()
  _id: ObjectId | string;

  @Prop({
    type: String,
    isRequired: [true, 'Field name is required!'],
    maxlength: [20, 'A name must contain less or equal than 20 symbols'],
    lowercase: true,
    validate: {
      validator: (val) => validator.isAlpha(val, 'en-US', { ignore: ' ' })
    }
  })
  name;

  @Prop({
    type: String,
    isRequired: [true, 'Field email is required!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail]
  })
  email;

  @Prop({
    type: String,
    default: 'default.jpg'
  })
  image;

  @Prop({
    type: String,
    required: [true, 'Field password is required!'],
    validate: [(val) => {
      validator.isStrongPassword(val, {
        minLength: 6,
        minNumbers: 1,
        minUppercase: 1,
        minLowercase: 1
      });
    }, '']
  })
  password: string;

  @Prop({
    type: String,
    required: [true, 'Field confirm password is required!'],
    // Works only on save and create!
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 'Passwords are not the same!'
    }
  })
  confirmPassword;

  @Prop({
    type: String
  })
  resetPasswordToken;

  @Prop({
    type: Date
  })
  resetPasswordExpires;

  @Prop({
    type: Number,
    default: 0
  })
  loginAttempts;

  @Prop({
    type: Date,
    default: Date.now() - 1
  })
  loginBanExpires;
}


export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function(next: Function) {
  if (this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});


