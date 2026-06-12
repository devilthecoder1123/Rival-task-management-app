import { useState, type ChangeEvent, type FormEvent } from 'react';

export type AuthFormValues = Record<string, string>;
export type AuthFormErrors = Partial<Record<string | 'root', string>>;

type ValidateFn<T extends AuthFormValues> = (values: T) => AuthFormErrors;

type UseAuthFormOptions<T extends AuthFormValues> = {
  initialValues: T;
  validate: ValidateFn<T>;
  onSubmit: (values: T) => Promise<void>;
};

export function useAuthForm<T extends AuthFormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseAuthFormOptions<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, root: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({ root: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, errors, isSubmitting, handleChange, handleSubmit };
}
