import React from 'react';

export default function ZukaBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="ZUKA Verified"
      style={{
        display: 'inline-block',
        verticalAlign: '-3px',
        marginLeft: '5px',
        flexShrink: 0
      }}
    >
      <path
        d="M12 1.6C13.7 1.6 15.1 2.8 15.5 4.4C17.1 3.9 18.9 4.6 19.7 6.1C20.5 7.5 20.2 9.4 18.9 10.6C20.2 11.8 20.5 13.7 19.7 15.1C18.9 16.6 17.1 17.3 15.5 16.8C15.1 18.4 13.7 19.6 12 19.6C10.3 19.6 8.9 18.4 8.5 16.8C6.9 17.3 5.1 16.6 4.3 15.1C3.5 13.7 3.8 11.8 5.1 10.6C3.8 9.4 3.5 7.5 4.3 6.1C5.1 4.6 6.9 3.9 8.5 4.4C8.9 2.8 10.3 1.6 12 1.6Z"
        transform="translate(0, 1.4)"
        fill="#1877F2"
      />
      <path
        d="M8.4 12.1L10.9 14.6L15.8 9.5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
