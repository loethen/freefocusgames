import styles from "./CareerTestCardIcon.module.css";

interface CareerTestCardIconProps {
  testId: string;
}

export function CareerTestCardIcon({ testId }: CareerTestCardIconProps) {
  if (testId === "criticall-practice-test") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-7 w-7 ${styles.svg}`}
      >
        <g className={styles.briefcaseGroup}>
          <path
            d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
            className={styles.briefcaseHandle}
          />
          <rect width="20" height="14" x="2" y="6" rx="2" />
          <path d="M22 13a18.15 18.15 0 0 1-20 0" />
          <path d="M12 11.5v1.5" className={styles.briefcaseClasp} />
        </g>
      </svg>
    );
  }

  if (testId === "10-key-typing-test") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-7 w-7 ${styles.svg}`}
      >
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="8" x2="16" y1="6" y2="6" className={styles.calcDisplay} />
        <line x1="16" x2="16" y1="14" y2="18" className={styles.calcEnter} />
        <path d="M16 10h.01" className={styles.calcKey4} />
        <path d="M12 10h.01" className={styles.calcKey2} />
        <path d="M8 10h.01" className={styles.calcKey1} />
        <path d="M12 14h.01" className={styles.calcKey3} />
        <path d="M8 14h.01" className={styles.calcKey5} />
        <path d="M12 18h.01" className={styles.calcKey2} />
        <path d="M8 18h.01" className={styles.calcKey4} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-7 w-7 ${styles.svg}`}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.22" />
      <circle cx="12" cy="12" r="10" className={styles.clockArc} />
      <path d="M12 6v6" className={styles.clockMinute} />
      <path d="M12 12h4.5" className={styles.clockHour} />
    </svg>
  );
}
