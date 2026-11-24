import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 1,
    titleEn: 'The Fake UPI Screenshot at Vendor Stalls (ನಕಲಿ ಯುಪಿಐ ಸ್ಕ್ರೀನ್‌ಶಾಟ್)',
    titleKn: 'ಅಂಗಡಿ & ವ್ಯಾಪಾರಿಗಳ ಬಳಿ ನಕಲಿ ಯುಪಿಐ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ತೋರಿಸುವುದು',
    tag: 'UPI Fraud',
    descEn:
      'A customer buys ₹400 worth of vegetables/goods, pretends to scan your QR code, and flashes a green "Payment Successful ₹400" screen on their phone. Your Soundbox did not announce anything, and you received no SMS.',
    descKn:
      'ಗ್ರಾಹಕರೊಬ್ಬರು ₹400 ಮೌಲ್ಯದ ತರಕಾರಿ/ಸಾಮಗ್ರಿ ಖರೀದಿಸಿ, ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಹಸಿರು "Payment Successful ₹400" ಸ್ಕ್ರೀನ್ ತೋರಿಸುತ್ತಾರೆ. ಆದರೆ ನಿಮ್ಮ ಸೌಂಡ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬರಲಿಲ್ಲ ಮತ್ತು ಬ್ಯಾಂಕ್ ಮೆಸೇಜ್ ಸಹ ಬಂದಿಲ್ಲ.',
    options: [
      {
        textEn: 'Believe their phone screen and let them take the goods immediately.',
        textKn: 'ಅವರ ಮೊಬೈಲ್ ಸ್ಕ್ರೀನ್ ನೋಡಿ ನಂಬಿ ಸಾಮಗ್ರಿಗಳನ್ನು ತಕ್ಷಣ ಒಯ್ಯಲು ಬಿಡುವುದು.',
        isSafe: false,
        feedbackEn:
          'DANGER! Scammers use "Fake Paytm/GPay" fake screenshot maker apps! Never release goods until your Soundbox announces the receipt or your official bank SMS arrives.',
        feedbackKn:
          'ಅಪಾಯ! ವಂಚಕರು ನಕಲಿ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಸೃಷ್ಟಿಸುವ ಫೇಕ್ ಆ್ಯಪ್‌ಗಳನ್ನು ಬಳಸುತ್ತಾರೆ! ಸೌಂಡ್‌ಬಾಕ್ಸ್ ಧ್ವನಿ ಕೇಳುವವರೆಗೆ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೆಸೇಜ್ ಬರುವವರೆಗೆ ಸಾಮಗ್ರಿಗಳನ್ನು ನೀಡಬೇಡಿ.',
      },
      {
        textEn: 'Politely say: "Please wait until my Soundbox voice alert confirms the payment or my bank SMS arrives."',
        textKn: '"ದಯವಿಟ್ಟು ಸೌಂಡ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಧ್ವನಿ ಕೇಳುವವರೆಗೆ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೆಸೇಜ್ ಬರುವವರೆಗೆ 1 ನಿಮಿಷ ಕಾಯಿರಿ" ಎಂದು ಹೇಳುವುದು.',
        isSafe: true,
        feedbackEn:
          'PERFECT! Real money has not reached your bank account until the soundbox announces it or your bank confirms.',
        feedbackKn:
          'ಉತ್ತಮ ನಿರ್ಧಾರ! ಸೌಂಡ್‌ಬಾಕ್ಸ್ ಧ್ವನಿ ಬರುವವರೆಗೆ ನಿಮ್ಮ ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗಿಲ್ಲ ಎಂದು ಅರ್ಥ.',
      },
    ],
  },
  {
    id: 2,
    titleEn: 'The "Advance Daily Wage via QR Code" Trap (ಅಡ್ವಾನ್ಸ್ ಹಣಕ್ಕೆ ಕ್ಯೂಆರ್ ಕೋಡ್)',
    titleKn: 'ದಿನಗೂಲಿ ಅಡ್ವಾನ್ಸ್ ಕೊಡಲು ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿಸುವ ವಂಚನೆ',
    tag: 'PIN Scam',
    descEn:
      'An unknown contractor calls saying: "I have ₹2,000 advance wage for your work tomorrow. Scan this QR code on PhonePe and enter your 4-digit PIN to receive the money into your account."',
    descKn:
      'ಅಪರಿಚಿತ ಮೇಸ್ತ್ರಿ ಅಥವಾ ಕಂಟ್ರಾಕ್ಟರ್ ಫೋನ್ ಮಾಡಿ: "ನಿಮಗೆ ನಾಳಿನ ಕೆಲಸದ ಅಡ್ವಾನ್ಸ್ ₹2,000 ಕಳುಹಿಸುತ್ತೇನೆ, ಈ ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ನಿಮ್ಮ 4-ಅಂಕಿಯ ಯುಪಿಐ ಪಿನ್ ಹಾಕಿ" ಎಂದು ಹೇಳುತ್ತಾರೆ.',
    options: [
      {
        textEn: 'Scan the QR code and enter your secret UPI PIN to receive the advance.',
        textKn: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಹಣ ಪಡೆಯಲು ನಿಮ್ಮ ರಹಸ್ಯ ಯುಪಿಐ ಪಿನ್ ನಮೂದಿಸುವುದು.',
        isSafe: false,
        feedbackEn:
          'HUGE TRAP! Entering a UPI PIN ALWAYS deducts money FROM your account! Receiving money NEVER requires entering your PIN. Your entire balance would be emptied!',
        feedbackKn:
          'ಬಹಳ ದೊಡ್ಡ ಮೋಸ! ಯುಪಿಐ ಪಿನ್ ಹಾಕಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗುತ್ತದೆ! ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಿನ್ ಹಾಕುವ ಅಗತ್ಯವಿಲ್ಲ!',
      },
      {
        textEn: 'Refuse firmly: "No PIN is needed to receive money. Send it directly to my phone number."',
        textKn: '"ಹಣ ಪಡೆಯಲು ಯಾವುದೇ ಪಿನ್ ಅಗತ್ಯವಿಲ್ಲ. ನೇರವಾಗಿ ನನ್ನ ಮೊಬೈಲ್ ನಂಬರ್‌ಗೆ ಕಳುಹಿಸಿ" ಎಂದು ನಿರಾಕರಿಸುವುದು.',
        isSafe: true,
        feedbackEn:
          'EXCELLENT! Scammers will immediately disconnect when they realize you know the Golden Rule of UPI PIN.',
        feedbackKn:
          'ನಿಖರ ಜಾಗೃತಿ! ಯುಪಿಐ ಪಿನ್ ನಿಯಮ ನಿಮಗೆ ತಿಳಿದಿದೆ ಎಂದು ಗೊತ್ತಾದ ತಕ್ಷಣ ವಂಚಕರು ಕರೆ ಕಟ್ ಮಾಡುತ್ತಾರೆ.',
      },
    ],
  },
  {
    id: 3,
    titleEn: 'Instant 7-Day Loan App Harassment Trap (ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್ ಸಾಲದ ಆ್ಯಪ್)',
    titleKn: '5 ನಿಮಿಷದಲ್ಲಿ ಸಾಲ ಕೊಡುವ ಅಕ್ರಮ ಲೋನ್ ಆ್ಯಪ್ ಮೋಸ',
    tag: 'Illegal Loan',
    descEn:
      'You need ₹5,000 urgently for an illness. An advertisement on Facebook promises "₹5,000 in 2 minutes without documents", but asks permission to access your Contacts and Photos.',
    descKn:
      'ಅನಾರೋಗ್ಯದ ಕಾರಣ ತುರ್ತಾಗಿ ₹5,000 ಹಣ ಬೇಕಾಗಿದೆ. ಫೇಸ್‌ಬುಕ್‌ನಲ್ಲಿ "ದಾಖಲೆಗಳಿಲ್ಲದೆ 2 ನಿಮಿಷದಲ್ಲಿ ₹5,000 ಸಾಲ" ಜಾಹೀರಾತು ನೋಡಿ ಆ್ಯಪ್ ಹಾಕಿದಾಗ ಅದು ನಿಮ್ಮ ಫೋನ್ ಕಾಂಟ್ಯಾಕ್ಟ್‌ಗಳು ಮತ್ತು ಫೋಟೋಗಳ ಅನುಮತಿ ಕೇಳುತ್ತದೆ.',
    options: [
      {
        textEn: 'Install the app and allow access to all contacts and photos because you need money urgently.',
        textKn: 'ತುರ್ತು ಹಣ ಬೇಕಾಗಿರುವುದರಿಂದ ಎಲ್ಲಾ ಕಾಂಟ್ಯಾಕ್ಟ್ ಮತ್ತು ಫೋಟೋಗಳಿಗೆ ಅನುಮತಿ ನೀಡುವುದು.',
        isSafe: false,
        feedbackEn:
          'LETHAL TRAP! These are illegal Chinese extortion loan apps. Within 5 days they demand ₹15,000 and threaten your family, children, and friends with abusive phone calls.',
        feedbackKn:
          'ಅತ್ಯಂತ ಅಪಾಯಕಾರಿ! ಇವು ಅಕ್ರಮ ಸುಲಿಗೆಕೋರ ಆ್ಯಪ್‌ಗಳು. 5 ದಿನಗಳಲ್ಲಿ ₹15,000 ಕಟ್ಟಿ ಎಂದು ನಿಮ್ಮ ಕುಟುಂಬ ಮತ್ತು ಸ್ನೇಹಿತರಿಗೆ ಕೆಟ್ಟದಾಗಿ ಕರೆ ಮಾಡಿ ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್ ಮಾಡುತ್ತಾರೆ.',
      },
      {
        textEn: 'Do not install! Apply for PM SVANidhi, Stree Shakti Sangha, or a Bank Gold Loan instead.',
        textKn: 'ಅಂತಹ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಬೇಡಿ! ಬ್ಯಾಂಕ್ ಅಥವಾ ಸ್ತ್ರೀ ಶಕ್ತಿ ಸಂಘದ ಸುರಕ್ಷಿತ ಸಾಲ ಪಡೆಯಿರಿ.',
        isSafe: true,
        feedbackEn:
          'SAFE CHOICE! Only borrow from RBI-registered banks or cooperative credit societies.',
        feedbackKn:
          'ಸುರಕ್ಷಿತ ಆಯ್ಕೆ! ಆರ್‌ಬಿಐ ಮಾನ್ಯತೆ ಪಡೆದ ಸರ್ಕಾರಿ ಬ್ಯಾಂಕ್ ಅಥವಾ ಸಹಕಾರಿ ಸಂಘಗಳಲ್ಲಿ ಮಾತ್ರ ಸಾಲ ಪಡೆಯಿರಿ.',
      },
    ],
  },
  {
    id: 4,
    titleEn: '"Free Ration / PM Kisan ₹5,000 Subsidy" SMS (ಉಚಿತ ರೇಷನ್ / ಸಬ್ಸಿಡಿ ಮೆಸೇಜ್)',
    titleKn: '"ಉಚಿತ ರೇಷನ್ / ಪಿಎಂ ಕಿಸಾನ್ ಹಣ" ಎಂಬ ನಕಲಿ ಲಿಂಕ್ ಮೆಸೇಜ್',
    tag: 'Phishing SMS',
    descEn:
      'An SMS arrives: "Dear Worker, your ₹5,000 government relief fund is approved. Click this link to download RationApp.apk and enter your bank password to claim immediately."',
    descKn:
      'ಒಂದು ಮೆಸೇಜ್ ಬರುತ್ತದೆ: "ಕಾರ್ಮಿಕರೇ, ನಿಮಗೆ ₹5,000 ಸರ್ಕಾರಿ ಪರಿಹಾರ ಮಂಜೂರಾಗಿದೆ. ತಕ್ಷಣ ಪಡೆಯಲು ಈ ಲಿಂಕ್ ಒತ್ತಿ RationApp.apk ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ವರ್ಡ್ ಹಾಕಿ."',
    options: [
      {
        textEn: 'Click the link and download the APK file to claim the ₹5,000 relief money.',
        textKn: 'ಹಣ ಸಿಗುತ್ತದೆ ಎಂದು ಲಿಂಕ್ ಒತ್ತಿ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಬ್ಯಾಂಕ್ ವಿವರ ಹಾಕುವುದು.',
        isSafe: false,
        feedbackEn:
          'DANGEROUS! The APK is a spy virus that reads your incoming OTPs and empties your Jan Dhan bank account within seconds.',
        feedbackKn:
          'ಮೋಸದ ಜಾಲ! ಆ ಆ್ಯಪ್ ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಬರುವ ಒಟಿಪಿ (OTP) ಕದ್ದು ನಿಮ್ಮ ಜನಧನ ಖಾತೆಯಲ್ಲಿರುವ ಎಲ್ಲಾ ಹಣವನ್ನು ದೋಚುತ್ತದೆ.',
      },
      {
        textEn: 'Delete the SMS. Government welfare subsidies are credited directly through DBT without APK downloads.',
        textKn: 'ಮೆಸೇಜ್ ಡಿಲೀಟ್ ಮಾಡಿ. ಸರ್ಕಾರದ ಹಣ ನೇರವಾಗಿ ನಿಮ್ಮ ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಖಾತೆಗೆ ಡಿಬಿಟಿ (DBT) ಮೂಲಕವೇ ಬರುತ್ತದೆ.',
        isSafe: true,
        feedbackEn:
          'EXCELLENT! Genuine government subsidies never ask you to install APK files or share your bank passwords.',
        feedbackKn:
          'ಸರಿಯಾದ ಜಾಗೃತಿ! ಸರ್ಕಾರ ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಎಂದು ಲಿಂಕ್ ಕಳುಹಿಸುವುದಿಲ್ಲ.',
      },
    ],
  },
];

export function ScamAwareness() {
  const { isKn } = useLanguage();
  const [selectedChoices, setSelectedChoices] = useState({});

  const handleSelect = (scenarioId, optIdx) => {
    setSelectedChoices(prev => ({
      ...prev,
      [scenarioId]: optIdx,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಕಾರ್ಮಿಕ ಜಾಗೃತಿ ಅಕಾಡೆಮಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Financial Literacy'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldAlert className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          {isKn ? 'ಕಾರ್ಮಿಕ ವಂಚನೆ ಮತ್ತು ಸೈಬರ್ ಕ್ರೈಮ್ ಜಾಗೃತಿ' : 'Worker Financial Scam Simulator'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isKn
            ? 'ದಿನಗೂಲಿ ಕಾರ್ಮಿಕರು ಮತ್ತು ಸಣ್ಣ ವ್ಯಾಪಾರಿಗಳನ್ನು ಗುರಿಯಾಗಿಸುವ ಆನ್‌ಲೈನ್ ಮೋಸಗಳಿಂದ ರಕ್ಷಿಸಿಕೊಳ್ಳುವ ವಿಧಾನ ಕಲಿಯಿರಿ.'
            : 'Test your defense against digital banking frauds, fake soundbox screenshots, and illegal loan app traps.'}
        </p>
      </div>

      {/* Emergency Helpline Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              {isKn ? 'ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಸಹಾಯವಾಣಿ: 1930 ಕರೆ ಮಾಡಿ' : 'National Cyber Crime Helpline: Dial 1930'}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              {isKn
                ? 'ಯಾವುದಾದರೂ ಆನ್‌ಲೈನ್ ವಂಚನೆ ನಡೆದರೆ ತಕ್ಷಣವೇ 1930 ಕರೆ ಮಾಡಿ ದೂರು ನೀಡಿ, ಹಣವನ್ನು ತಡೆಯಬಹುದು.'
                : 'Report financial fraud within 2-4 hours to immediately freeze illicit UPI accounts.'}
            </p>
          </div>
        </div>
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shrink-0 min-h-[44px]"
        >
          cybercrime.gov.in
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Scenarios */}
      <div className="space-y-6">
        {SCENARIOS.map(sc => {
          const userChoice = selectedChoices[sc.id];
          const choiceData = userChoice !== undefined ? sc.options[userChoice] : null;

          return (
            <div
              key={sc.id}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {sc.tag}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {isKn ? `ಉದಾಹರಣೆ #${sc.id}` : `Scenario #${sc.id}`}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {isKn ? sc.titleKn : sc.titleEn}
              </h3>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                "{isKn ? sc.descKn : sc.descEn}"
              </div>

              <p className="text-xs font-semibold text-slate-500 mb-2">
                {isKn ? 'ಈ ಸಂದರ್ಭದಲ್ಲಿ ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?' : 'What would you do?'}
              </p>

              <div className="space-y-2.5">
                {sc.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(sc.id, optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between min-h-[48px] ${
                      userChoice === optIdx
                        ? opt.isSafe
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="leading-relaxed">{isKn ? opt.textKn : opt.textEn}</span>
                    {userChoice === optIdx && (
                      opt.isSafe ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0 ml-2" />
                      )
                    )}
                  </button>
                ))}
              </div>

              {/* Feedback box */}
              {choiceData && (
                <div
                  className={`mt-4 p-3.5 rounded-xl text-xs leading-relaxed border ${
                    choiceData.isSafe
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <span className="font-bold">
                    {choiceData.isSafe
                      ? (isKn ? 'ಫಲಿತಾಂಶ: ಸುರಕ್ಷಿತ ನಿರ್ಧಾರ! ' : 'Verdict: SAFE ')
                      : (isKn ? 'ಫಲಿತಾಂಶ: ಅಪಾಯಕಾರಿ! ' : 'Verdict: COMPROMISED ')}
                  </span>
                  — {isKn ? choiceData.feedbackKn : choiceData.feedbackEn}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default ScamAwareness;
