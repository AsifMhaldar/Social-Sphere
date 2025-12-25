import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from '../authSlice';
import { useEffect, useState } from 'react';

// Schema validation
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password should contain at least 8 characters")
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    if (isAuthenticated)
      navigate('/home');
  }, [isAuthenticated, navigate]);

  // Show backend errors in the form
  useEffect(() => {
    if (error) {
      // Example: backend error contains "email" or "password"
      if (error.toLowerCase().includes('email')) {
        setError('email', { type: 'server', message: error });
      } else if (error.toLowerCase().includes('password')) {
        setError('password', { type: 'server', message: error });
      } else {
        // Fallback
        setError('email', { type: 'server', message: error });
      }
    }
  }, [error, setError]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500">
        <h3 className="text-2xl font-bold text-white mb-2">Sign In</h3>
        <p className="text-gray-400 mb-6">Welcome back to Codify-CODE</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="john@example.com"
              className={`w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
              }`}
            />
            {errors.email && (
              <span className="text-red-400 text-sm mt-1 block">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                } pr-10`}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-400 text-sm mt-1 block">{errors.password.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`w-full py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transition-all'
            }`}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4">
          Don’t have an account?{' '}
          <NavLink to="/" className="text-blue-400 hover:text-blue-300">
            Register
          </NavLink>
        </p>
      </div>
    </div>
  );
}

export default Login;
