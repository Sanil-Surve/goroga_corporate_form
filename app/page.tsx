'use client';

import { useState } from 'react';

const FEEL_OPTIONS = ['Much Better', 'Better', 'Same', 'Worse'] as const;
const NOTICED_OPTIONS = [
  'More Relaxed',
  'Calmer Mind',
  'Better Focus',
  'Less Stress',
  'More Energy',
  'No Difference',
] as const;
const USE_AGAIN_OPTIONS = ['Yes', 'No', 'Maybe'] as const;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function GoRogaForm() {
  const [pulseBefore, setPulseBefore] = useState('');
  const [pulseAfter, setPulseAfter] = useState('');
  const [feeling, setFeeling] = useState('');
  const [noticed, setNoticed] = useState<string[]>([]);
  const [noticedOther, setNoticedOther] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [wouldUseAgain, setWouldUseAgain] = useState('');
  const [oneWord, setOneWord] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleNoticed = (value: string) => {
    setNoticed((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleOtherToggle = (checked: boolean) => {
    setShowOther(checked);
    if (!checked) setNoticedOther('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMsg('');

    const allNoticed = [...noticed];
    if (showOther && noticedOther.trim()) {
      allNoticed.push(noticedOther.trim());
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pulse_before: pulseBefore,
          pulse_after: pulseAfter,
          feeling,
          noticed: allNoticed,
          would_use_again: wouldUseAgain,
          one_word: oneWord,
        }),
      });

      if (res.ok) {
        setSubmitState('success');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong.');
        setSubmitState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setSubmitState('error');
    }
  };

  const handleClear = () => {
    setPulseBefore('');
    setPulseAfter('');
    setFeeling('');
    setNoticed([]);
    setNoticedOther('');
    setShowOther(false);
    setWouldUseAgain('');
    setOneWord('');
    setSubmitState('idle');
    setErrorMsg('');
  };

  if (submitState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a7e8c 0%, #085f6a 50%, #064d57 100%)' }}>
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e0f4f6' }}>
            <svg className="w-8 h-8" fill="none" stroke="#0a7e8c" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h2>
          <p className="text-gray-500 mb-6">Your response has been recorded successfully.</p>
          <button
            onClick={handleClear}
            className="px-6 py-2 rounded-full text-white font-medium transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0a7e8c, #064d57)' }}
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6" style={{ background: 'linear-gradient(135deg, #0a7e8c 0%, #085f6a 50%, #064d57 100%)' }}>
      <div className="w-full max-w-2xl my-3 sm:my-8">
        {/* Header card */}
        <div
          className="rounded-t-2xl px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #085f6a 0%, #064d57 100%)',
            borderTop: '6px solid #a7dde3',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">GoRoga Feedback Form</h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm" style={{ color: '#b8e8ec' }}>* Indicates required question</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-2xl shadow-xl divide-y divide-gray-100"
        >
          {/* Q1.1 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              1.1) Pulse Reading Before Session{' '}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              required
              value={pulseBefore}
              onChange={(e) => setPulseBefore(e.target.value)}
              placeholder="Your answer"
              className="w-full border-b-2 border-gray-300 focus:border-[#0a7e8c] outline-none py-1.5 text-gray-700 transition-colors bg-transparent"
            />
          </div>

          {/* Q1.2 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              1.2) Pulse Reading After Session{' '}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              required
              value={pulseAfter}
              onChange={(e) => setPulseAfter(e.target.value)}
              placeholder="Your answer"
              className="w-full border-b-2 border-gray-300 focus:border-[#0a7e8c] outline-none py-1.5 text-gray-700 transition-colors bg-transparent"
            />
          </div>

          {/* Q2 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <fieldset>
              <legend className="text-sm font-medium text-gray-800 mb-3">
                2) How do you feel now compared to before the session?{' '}
                <span className="text-red-500 ml-0.5">*</span>
              </legend>
              <div className="space-y-2">
                {FEEL_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="feeling"
                      value={option}
                      required
                      checked={feeling === option}
                      onChange={() => setFeeling(option)}
                      className="w-4 h-4 accent-[#0a7e8c]"
                    />
                    <span className="text-gray-700 text-sm group-hover:text-[#0a7e8c] transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Q3 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <fieldset>
              <legend className="text-sm font-medium text-gray-800 mb-3">
                3) What did you notice the most?{' '}
                <span className="text-red-500 ml-0.5">*</span>
              </legend>
              <div className="space-y-2">
                {NOTICED_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      value={option}
                      checked={noticed.includes(option)}
                      onChange={() => toggleNoticed(option)}
                      className="w-4 h-4 accent-[#0a7e8c] rounded"
                    />
                    <span className="text-gray-700 text-sm group-hover:text-[#0a7e8c] transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
                {/* Other option */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showOther}
                      onChange={(e) => handleOtherToggle(e.target.checked)}
                      className="w-4 h-4 accent-[#0a7e8c] rounded"
                    />
                    <span className="text-gray-700 text-sm group-hover:text-[#0a7e8c] transition-colors">
                      Other:
                    </span>
                  </label>
                  {showOther && (
                    <input
                      type="text"
                      value={noticedOther}
                      onChange={(e) => setNoticedOther(e.target.value)}
                      placeholder="Your answer"
                      className="mt-1.5 ml-7 w-[calc(100%-1.75rem)] border-b border-gray-400 focus:border-[#0a7e8c] outline-none py-1 text-gray-700 text-sm transition-colors bg-transparent"
                    />
                  )}
                </div>
              </div>
            </fieldset>
          </div>

          {/* Q4 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <fieldset>
              <legend className="text-sm font-medium text-gray-800 mb-3">
                4) Would you use GoRoga again?{' '}
                <span className="text-red-500 ml-0.5">*</span>
              </legend>
              <div className="space-y-2">
                {USE_AGAIN_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="would_use_again"
                      value={option}
                      required
                      checked={wouldUseAgain === option}
                      onChange={() => setWouldUseAgain(option)}
                      className="w-4 h-4 accent-[#0a7e8c]"
                    />
                    <span className="text-gray-700 text-sm group-hover:text-[#0a7e8c] transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Q5 */}
          <div className="px-5 sm:px-8 py-5 sm:py-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Describe your experience in one word.{' '}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              required
              value={oneWord}
              onChange={(e) => setOneWord(e.target.value)}
              placeholder="Your answer"
              rows={2}
              className="w-full border-b-2 border-gray-300 focus:border-[#0a7e8c] outline-none py-1.5 text-gray-700 transition-colors bg-transparent resize-none"
            />
          </div>

          {/* Error message */}
          {submitState === 'error' && (
            <div className="px-5 sm:px-8 py-3 bg-red-50 text-red-600 text-sm">{errorMsg}</div>
          )}

          {/* Actions */}
          <div className="px-5 sm:px-8 py-5 sm:py-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={submitState === 'loading'}
              className="px-6 sm:px-8 py-2.5 rounded-full text-white font-medium shadow-md transition-opacity hover:opacity-90 disabled:opacity-70 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0a7e8c, #064d57)' }}
            >
              {submitState === 'loading' ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-medium transition-colors hover:opacity-70 cursor-pointer"
              style={{ color: '#0a7e8c' }}
            >
              Clear form
            </button>
          </div>

          <p className="px-5 sm:px-8 py-4 text-xs text-gray-400 rounded-b-2xl">
            Never submit passwords through this form.
          </p>
        </form>
      </div>
    </div>
  );
}
