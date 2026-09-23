import React from "react";

interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

const clampScore = (value: number) => Math.min(10, Math.max(1, Math.round(value * 4) / 4));

const ScoreSlider: React.FC<ScoreSliderProps> = ({
  value,
  onChange,
  label = "Your score",
  id,
  disabled = false,
}) => {
  const score = clampScore(Number(value) || 1);
  const percentage = ((score - 1) / 9) * 100;
  const hue = (percentage / 100) * 120;

  return (
    <label className="score-spike-slider" htmlFor={id} style={{ "--score-position": `${percentage}%`, "--score-hue": hue } as React.CSSProperties}>
      <span className="score-spike-slider__heading">
        <span>{label}</span>
        <output htmlFor={id} aria-live="polite">{score.toFixed(2).replace(/\.00$/, ".0")} <small>/ 10</small></output>
      </span>
      <span className="score-spike-slider__control">
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={0.25}
          value={score}
          disabled={disabled}
          aria-label={`${label}: ${score} out of 10`}
          onChange={(event) => onChange(clampScore(Number(event.target.value)))}
        />
        <span className="score-spike-slider__ticks" aria-hidden="true" />
      </span>
      <span className="score-spike-slider__scale" aria-hidden="true"><span>1</span><span>5.5</span><span>10</span></span>
    </label>
  );
};

export default ScoreSlider;
