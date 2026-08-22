import { Icon } from '../ui/Icon';

export interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label = 'Quantity',
  size = 'md',
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div className={`stepper stepper-${size}`}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(value - 1)}
        disabled={atMin}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Icon name="minus" size={15} />
      </button>

      <input
        type="number"
        className="stepper-value"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />

      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Icon name="plus" size={15} />
      </button>
    </div>
  );
}
