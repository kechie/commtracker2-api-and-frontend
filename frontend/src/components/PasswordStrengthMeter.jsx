// PasswordStrengthMeter.jsx
import { useMemo } from 'react';
import { ProgressBar } from 'react-bootstrap';

const PasswordStrengthMeter = ({ password }) => {
  const checks = useMemo(() => {
    return [
      { text: 'At least 8 characters', passed: password.length >= 8 },
      { text: 'At least 12 characters (recommended)', passed: password.length >= 12 },
      { text: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
      { text: 'Contains lowercase letter', passed: /[a-z]/.test(password) },
      { text: 'Contains number', passed: /[0-9]/.test(password) },
      { text: 'Contains special character', passed: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  const strength = checks.filter(c => c.passed).length;
  const color = ['danger', 'danger', 'warning', 'info', 'info', 'success'][strength];

  return (
    <div className="mt-2">
      <ProgressBar
        now={(strength / 6) * 100}
        variant={color}
        style={{ height: '8px', marginBottom: '8px' }}
      />

      <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem' }}>
        {checks.map((check, i) => (
          <li
            key={i}
            style={{
              color: check.passed ? '#198754' : '#6c757d',
              textDecoration: check.passed ? 'line-through' : 'none',
              opacity: check.passed ? 0.7 : 1,
            }}
          >
            {check.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;

/* import { useMemo } from 'react';
import { ProgressBar } from 'react-bootstrap';

const strengthLevels = [
  { score: 0, label: 'Very Weak', color: 'danger' },
  { score: 1, label: 'Weak', color: 'danger' },
  { score: 2, label: 'Fair', color: 'warning' },
  { score: 3, label: 'Good', color: 'info' },
  { score: 4, label: 'Strong', color: 'success' },
];

const calculateStrength = (password = '') => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Bonus points
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  return Math.min(4, score); // cap at 4
};

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const { label, color } = strengthLevels[strength];

  return (
    <div className="mt-1 mb-3">
      <ProgressBar
        now={(strength / 4) * 100}
        variant={color}
        style={{ height: '8px' }}
      />
      <small className={`text-${color} d-block mt-1`}>
        Password strength: <strong>{label}</strong>
      </small>
    </div>
  );
};

export default PasswordStrengthMeter; */