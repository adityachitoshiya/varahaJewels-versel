import { useState, useEffect } from 'react';

export default function PremiumPayButton({ onClick, isLoading, isSuccess, disabled, text = "Pay now" }) {

    return (
        <>
            <button
                className={`pay-btn ${isLoading ? 'loading' : ''} ${isSuccess ? 'success' : ''}`}
                onClick={(isLoading || isSuccess) ? undefined : onClick}
                disabled={disabled || isLoading || isSuccess}
            >
                <span className="btn-text">{text}</span>
                <div className="circle-loader"></div>
                <div className="check-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </button>

            <style jsx>{`
        .pay-btn {
            --btn-bg: #A3562A; /* Copper */
            --success-green: #10b981;
            --btn-text: #ffffff;
            --liner-color: rgba(255, 255, 255, 0.3);
            --spinner-border: rgba(255, 255, 255, 0.4);
            --shadow-copper: rgba(163, 86, 42, 0.4);
            --shadow-success: rgba(16, 185, 129, 0.5);

            position: relative;
            background-color: var(--btn-bg);
            color: var(--btn-text);
            border: none;
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            min-width: 190px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px 0 var(--shadow-copper);
            outline: none;
            overflow: hidden; 
            white-space: nowrap;
            /* Improved transition for ultimate smoothness */
            transition: 
                background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                min-width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pay-btn:hover:not(.loading):not(.success):not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 var(--shadow-copper);
        }

        .pay-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        /* 1. Progress Liner Background */
        .pay-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0%;
            height: 100%;
            background-color: var(--liner-color);
            z-index: 1;
            opacity: 0;
            transition: width 3s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.4s ease;
        }

        .pay-btn.loading::before {
            opacity: 1;
            width: 90%; 
        }

        .pay-btn.success::before {
            opacity: 0;
            width: 100%;
            transition: width 0.4s ease-out, opacity 0.5s ease-out;
        }

        /* 2. Center Circle Loader - Spin Fix */
        .circle-loader {
            position: absolute;
            width: 22px;
            height: 22px;
            border: 3px solid var(--spinner-border);
            border-top-color: #fff;
            border-radius: 50%;
            z-index: 3;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }

        .pay-btn.loading .circle-loader {
            opacity: 1;
            transform: scale(1);
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Loading State */
        .pay-btn.loading {
            cursor: wait;
            border-radius: 30px;
            min-width: 170px;
            box-shadow: 0 2px 10px 0 var(--shadow-copper);
        }

        /* Success State - Premium Shadow Transition */
        .pay-btn.success {
            background-color: var(--success-green) !important;
            box-shadow: 0 10px 30px 0 var(--shadow-success);
            transform: scale(1.05);
            border-radius: 12px;
        }

        .btn-text {
            position: relative;
            z-index: 2;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pay-btn.loading .btn-text {
            opacity: 0;
            transform: translateY(10px);
        }

        .pay-btn.success .btn-text {
            opacity: 0;
            transform: scale(0.5);
        }

        /* 3. Success Checkmark */
        .check-icon {
            position: absolute;
            opacity: 0;
            z-index: 4;
            transform: scale(0) rotate(-30deg);
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pay-btn.success .check-icon {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }

        /* 4. Soft Pulse Celebration */
        @keyframes softPulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
            100% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
        }

        .pay-btn.success {
            animation: softPulse 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
        </>
    );
}
