import { cx } from '../util/cx';

export interface StepperProps {
  /** Ordered step labels, left to right. */
  steps: string[];
  /** Index of the current step. Steps before it are "done", after it "upcoming". */
  activeIndex: number;
}

type StepState = 'done' | 'current' | 'upcoming';

const circleByState: Record<StepState, string> = {
  done: 'bg-green text-white border-green',
  current: 'bg-navy text-white border-navy',
  upcoming: 'bg-surface text-mute border-line',
};

const labelByState: Record<StepState, string> = {
  done: 'text-ink',
  current: 'text-ink font-semibold',
  upcoming: 'text-mute',
};

function stateFor(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return 'done';
  if (index === activeIndex) return 'current';
  return 'upcoming';
}

/**
 * Horizontal step indicator for a small state machine (e.g. a deal lifecycle).
 * Steps before `activeIndex` render as done (green + check), the active step as
 * current (navy), and the rest as upcoming (grey). Connectors fill in as
 * progress passes them.
 */
export function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <ol className="flex items-start" role="list">
      {steps.map((label, i) => {
        const state = stateFor(i, activeIndex);
        const isLast = i === steps.length - 1;
        return (
          <li key={label} className={cx('flex items-start', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-pill border text-xs font-semibold',
                  circleByState[state],
                )}
              >
                {state === 'done' ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 8.5l3 3 6-6.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={cx('mt-1.5 max-w-[7rem] text-center text-xs', labelByState[state])}>{label}</span>
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className={cx('mt-3.5 h-px flex-1', i < activeIndex ? 'bg-green' : 'bg-line')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
