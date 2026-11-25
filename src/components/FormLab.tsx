import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  evaluatePasswordStrength,
  validateTestForm,
  type DemoLocale,
  type FormTestValues,
  type FormValidationErrors,
} from '../utils/demoLogic';

interface FormLabProps {
  locale: DemoLocale;
  onNotify: (kind: 'success' | 'warning' | 'error', text: string) => void;
}

const EMPTY_FORM: FormTestValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'tester',
  birthDate: '2026-11-25',
  notes: '',
  acceptedTerms: false,
};

export function FormLab({ locale, onNotify }: FormLabProps) {
  const bn = locale === 'bn';
  const [values, setValues] = useState<FormTestValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<FormTestValues | null>(
    null
  );

  const strength = evaluatePasswordStrength(values.password);

  const fillValidSample = () => {
    setValues({
      fullName: 'Tanvir Ahmed',
      email: 'tanvir.qa@example.com',
      phone: '+8801712345678',
      password: 'SecureTest99!',
      role: 'tester',
      birthDate: '2026-11-25',
      notes: 'Automated regression check sample',
      acceptedTerms: true,
    });
    setErrors({});
    setSubmittedPayload(null);
  };

  const triggerInvalidSample = () => {
    const bad: FormTestValues = {
      fullName: 'A',
      email: 'not-an-email',
      phone: '0012',
      password: '123',
      role: 'tester',
      birthDate: '',
      notes: '',
      acceptedTerms: false,
    };
    setValues(bad);
    setSubmittedPayload(null);
    const nextErrors = validateTestForm(bad, locale);
    setErrors(nextErrors);
    onNotify(
      'warning',
      bn ? 'ভ্যালিডেশন এররগুলো নিচে দেখানো হয়েছে।' : 'Validation errors triggered for testing.'
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateTestForm(values, locale);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmittedPayload(null);
      onNotify(
        'error',
        bn ? 'অনুগ্রহ করে চিহ্নিত ভুলগুলো ঠিক করুন।' : 'Please resolve the highlighted field errors.'
      );
      return;
    }
    setSubmittedPayload(values);
    onNotify(
      'success',
      bn ? 'ফর্ম সাবমিশন সফলভাবে যাচাই হয়েছে।' : 'Form validation passed and payload captured.'
    );
  };

  return (
    <section aria-labelledby="form-lab-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="form-lab-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            style={{ textWrap: 'balance' }}
          >
            {bn ? '02. ফর্ম ও ভ্যালিডেশন টেস্ট ল্যাব' : '02. Form & Input Validation Lab'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {bn
              ? 'ইমেইল, ফোন নম্বর, পাসওয়ার্ড শক্তি ও এরর স্টেট সরাসরি পরীক্ষা করে দেখুন।'
              : 'Test client-side field validation, password strength scoring, error states, and serialized form payloads.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fillValidSample}
            className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 hover:border-sky-500/60 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-sky-400"
          >
            {bn ? 'সঠিক ডেটা বসাও' : 'Fill Valid Sample'}
          </button>
          <button
            type="button"
            onClick={triggerInvalidSample}
            className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 hover:border-amber-500/60 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400"
          >
            {bn ? 'ভুল ইনপুট টেস্ট করো' : 'Trigger Validation Errors'}
          </button>
          <button
            type="button"
            onClick={() => {
              setValues(EMPTY_FORM);
              setErrors({});
              setSubmittedPayload(null);
            }}
            className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {bn ? 'পরিষ্কার করো' : 'Clear'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111824] lg:col-span-7"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="test-fullname"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'পূর্ণ নাম' : 'Full Name'}
              </label>
              <input
                id="test-fullname"
                type="text"
                value={values.fullName}
                onChange={(e) => setValues({ ...values, fullName: e.target.value })}
                placeholder="Nadia Rahman"
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="test-email"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'ইমেইল' : 'Email Address'}
              </label>
              <input
                id="test-email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                placeholder="qa@example.com"
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="test-phone"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'মোবাইল নম্বর (BD)' : 'Phone Number (BD)'}
              </label>
              <input
                id="test-phone"
                type="tel"
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
                placeholder="+8801712345678"
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="test-role"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'রোল' : 'User Role'}
              </label>
              <select
                id="test-role"
                value={values.role}
                onChange={(e) =>
                  setValues({
                    ...values,
                    role: e.target.value as FormTestValues['role'],
                  })
                }
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="tester">QA Tester</option>
                <option value="developer">Software Developer</option>
                <option value="designer">UI Designer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="test-password"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="test-password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={(e) => setValues({ ...values, password: e.target.value })}
                  placeholder="Min 8 chars + number"
                  className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="grid flex-1 grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${
                        strength.score >= step
                          ? strength.score >= 3
                            ? 'bg-emerald-500'
                            : strength.score === 2
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {bn ? strength.labelBn : strength.labelEn}
                </span>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="test-date"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {bn ? 'টেস্ট তারিখ' : 'Test Date'}
              </label>
              <input
                id="test-date"
                type="date"
                value={values.birthDate}
                onChange={(e) => setValues({ ...values, birthDate: e.target.value })}
                className="min-h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {errors.birthDate && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.birthDate}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="test-notes"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {bn ? 'নোট (ঐচ্ছিক)' : 'Test Notes (Optional)'}
            </label>
            <textarea
              id="test-notes"
              rows={2}
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
              placeholder={bn ? 'যেকোনো মন্তব্য লিখুন...' : 'Optional smoke test remarks...'}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={values.acceptedTerms}
                onChange={(e) =>
                  setValues({ ...values, acceptedTerms: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>
                {bn
                  ? 'আমি ডেমো ফর্ম ভ্যালিডেশন টেস্ট শর্তাবলি মেনে নিচ্ছি'
                  : 'I accept the demo form test conditions'}
              </span>
            </label>
            {errors.acceptedTerms && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.acceptedTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="min-h-[42px] rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {bn ? 'ফর্ম সাবমিট ও যাচাই করুন' : 'Submit & Validate Form'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111824] lg:col-span-5">
          <h2 className="border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
            {bn ? 'সাবমিট হওয়া JSON পেলোড' : 'Serialized Output Preview'}
          </h2>
          {submittedPayload ? (
            <pre
              data-testid="form-json-output"
              className="mt-4 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-[#0b1117] dark:text-slate-200"
            >
              <code>
                {JSON.stringify(
                  {
                    ...submittedPayload,
                    password: '•'.repeat(submittedPayload.password.length),
                  },
                  null,
                  2
                )}
              </code>
            </pre>
          ) : (
            <p className="py-12 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {bn
                ? 'ফর্মটি সঠিকভাবে পূরণ করে সাবমিট করলে এখানে JSON আউটপুট দেখা যাবে।'
                : 'Fill valid fields or click "Fill Valid Sample" and submit to inspect the validated JSON payload.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
