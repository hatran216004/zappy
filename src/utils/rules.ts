import * as yup from 'yup';

export const registerSchema = yup.object({
  username: yup.string().required('Username là bắt buộc'),

  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),

  password: yup
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .required('Mật khẩu là bắt buộc')
    .matches(/[a-z]/, 'Phải có ít nhất 1 chữ thường (a-z)')
    .matches(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa (A-Z)')
    .matches(/[0-9]/, 'Phải có ít nhất 1 số (0-9)')
    .matches(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
      'Phải có ít nhất 1 ký tự đặc biệt'
    ),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),

  agreeTerms: yup
    .boolean()
    .oneOf([true], 'Bạn phải đồng ý với điều khoản sử dụng')
    .required()
});

export type RegisterSchema = yup.InferType<typeof registerSchema>;
