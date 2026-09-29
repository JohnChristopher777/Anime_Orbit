import React from "react";

interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

const clampScore = (value: number) => Math.min(10, Math.max(0, Math.round(value * 4) / 4));

const ScoreSlider: React.FC<ScoreSliderProps> = ({
  value,
  onChange,
  label = "Your score",
  id,
  disabled = false,
}) => {
  const score = clampScore(Number(value) || 0);
  const percentage = (score / 10) * 100;
  const hue = (percentage / 100) * 120;

  return (
    <label className="score-spike-slider" htmlFor={id} style={{ "--score-position": `${percentage}%`, "--score-hue": hue } as React.CSSProperties}>
      <span className="score-spike-slider__heading">
        <span>{label}</span>
        <output htmlFor={id} aria-live="polite">{score > 0 ? score.toFixed(2).replace(/\.00$/, ".0") : "Not rated"} {score > 0 && <small>/ 10</small>}</output>
      </span>
      <span className="score-spike-slider__control">
        <input
          id={id}
          type="range"
          min={0}
          max={10}
          step={0.25}
          value={score}
          disabled={disabled}
          aria-label={score > 0 ? `${label}: ${score} out of 10` : `${label}: not rated`}
          onChange={(event) => onChange(clampScore(Number(event.target.value)))}
        />
        <span className="score-spike-slider__ticks" aria-hidden="true" />
      </span>
      <span className="score-spike-slider__scale" aria-hidden="true"><span>Not rated</span><span>5</span><span>10</span></span>
    </label>
  );
};

export default ScoreSlider;
