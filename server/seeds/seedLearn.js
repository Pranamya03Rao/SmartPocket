import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Tip from '../models/Tip.js';

const lessonsData = [
  {
    title: 'Daily Wages, Cash Flow & Safe UPI / Soundbox (ದಿನಗೂಲಿ & ಯುಪಿಐ ಸುರಕ್ಷತೆ)',
    slug: 'daily-wages-jandhan-upi',
    order: 1,
    category: 'banking',
    content: `### Managing Daily Wages & Digital Payments for Workers
Whether you are a street vendor, construction worker, auto driver, or domestic helper, your daily income fluctuates. Keeping your hard-earned money safe from theft and fraud is the foundation of financial peace.

#### 1. Zero Balance Jan Dhan Bank Account (ಜನ-ಧನ ಖಾತೆ)
- You do NOT need thousands of rupees to open a bank account. Under Pradhan Mantri Jan Dhan Yojana (PMJDY), any worker can open a zero-balance account with just an Aadhaar card.
- It comes with a free RuPay debit card and built-in accidental insurance cover of up to ₹2 Lakhs.
- Keep your passbook and ATM card safely at home; do not hand them over to contractors or money lenders as collateral!

#### 2. Soundbox & QR Code Safety for Vendors & Small Shops
- **The Voice Alert Rule**: When a customer scans your QR code, NEVER assume payment has arrived based on their screen screenshot! Always wait for the voice alert from your Soundbox (Paytm / PhonePe) or check your bank SMS.
- Fake payment screenshot generator apps exist. Do not trust what a stranger shows on their mobile screen.

#### 3. Golden Rule of UPI PIN:
- **UPI PIN is ONLY entered to SEND money or make a payment out of your account.**
- You NEVER need to enter your PIN, scan a QR code, or approve a "Collect Request" to receive money, daily wages, or government subsidies.
- If anyone says "Enter your PIN to receive ₹500 advance", it is 100% a fraud!`,
    published: true,
  },
  {
    title: 'Meter Baddi & Instant Loan App Traps (ಮೀಟರ್ ಬಡ್ಡಿ & ಅಕ್ರಮ ಸಾಲದ ಮೋಸ)',
    slug: 'meter-baddi-instant-loan-traps',
    order: 2,
    category: 'credit',
    content: `### Escaping the Debt Trap: Private Money Lenders vs Bank Credit
Daily-wage workers frequently face sudden cash shortages for hospital visits, children's school books, or seasonal gaps. Unscrupulous lenders exploit this vulnerability.

#### 1. The Reality of Meter Baddi (ಮೀಟರ್ ಬಡ್ಡಿ)
- Private money lenders often charge **5% to 10% interest PER MONTH** (or ₹100 per day for ₹1,000 borrowed).
- This equals **60% to 120% per year**! If you borrow ₹10,000 at 10% per month, you pay ₹12,000 in interest alone in one year and still owe the original ₹10,000.
- Many workers spend their entire lives paying interest without ever clearing the principal.

#### 2. Beware of Instant Mobile Loan Apps (ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್ ಸಾಲದ ಆ್ಯಪ್‌ಗಳು)
- Chinese / illegal loan apps advertise: *"Get ₹5,000 in 2 minutes without documents"*.
- When installed, they steal your entire contact list and personal photos.
- Within 5 days, they demand ₹10,000 and harass your family, relatives, and employers with abusive phone calls and morphing photos.
- **Rule**: NEVER download loan apps outside RBI-regulated banks or registered NBFCs.

#### 3. Safe Alternatives:
- **PM SVANidhi (ಪಿಎಂ ಸ್ವನಿಧಿ)**: Street vendors get ₹10,000 to ₹50,000 working capital loan at subsidized 7% interest from nationalized banks with no collateral.
- **SHG / Stree Shakti Sanghas (ಸ್ತ್ರೀ ಶಕ್ತಿ ಸಂಘಗಳು)**: Group loans at 1% per month.
- **Gold Loan from Public Sector Banks (SBI / Canara Bank)**: Gold loans from banks charge 8.5%-9.5% per annum, unlike pawnbrokers who charge 24%-36%.`,
    published: true,
  },
  {
    title: 'Government Welfare Schemes & Insurance (ಕಾರ್ಮಿಕರ ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳು)',
    slug: 'govt-welfare-schemes-workers',
    order: 3,
    category: 'investing',
    content: `### Social Security Schemes Every Worker Must Claim
The government provides high-benefit, low-cost social protection specifically for unorganized labourers and gig workers.

#### 1. e-Shram Card (ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್)
- Free national registration for unorganized workers (construction, tailoring, domestic workers, street vendors, mechanics).
- Provides a 12-digit UAN number and accidental death/disability coverage of up to ₹2 Lakhs.
- Direct benefit transfer during natural disasters or government relief packages.

#### 2. PM-SYM Pension (ಪ್ರಧಾನ ಮಂತ್ರಿ ಶ್ರಮ ಯೋಗಿ ಮಾನ್‌ಧನ್)
- For workers aged 18 to 40 with monthly income below ₹15,000.
- You contribute a small amount (₹55 to ₹200 per month depending on your age) and the Central Government matches the exact same amount.
- Guaranteed monthly pension of **₹3,000 per month** after age 60 for lifelong financial dignity.

#### 3. Low-Cost Government Insurance:
- **PMJJBY (Life Insurance)**: ₹436/year (just ₹1.20/day) gives ₹2 Lakh life insurance cover for your family in case of death from any cause.
- **PMSBY (Accident Insurance)**: ₹20/year gives ₹2 Lakh accidental death cover.
- **Ayushman Bharat / Arogya Karnataka**: Free cashless hospital treatment up to ₹5 Lakhs per family per year at empaneled hospitals.`,
    published: true,
  },
  {
    title: 'Safe Small Savings: Post Office RD & Emergency Fund (ಉಳಿತಾಯ & ತುರ್ತು ನಿಧಿ)',
    slug: 'daily-savings-post-office-gold-loan',
    order: 4,
    category: 'budgeting',
    content: `### Building a Safety Net With ₹20 to ₹50 a Day
When income comes daily, small daily amounts slip away on unnecessary tea, pan, or loose spending. Redirecting just ₹30 a day protects your family from sudden medical crises.

#### 1. The ₹30 a Day Magic (ದಿನಕ್ಕೆ 30 ರೂ ಉಳಿತಾಯ)
- Saving ₹30/day = ₹900/month.
- In 1 year, you have **₹10,800 cash reserve**.
- This means the next time your child needs school uniform fees or the auto rickshaw needs a tyre replacement, you do NOT have to beg a meter-baddi moneylender!

#### 2. Post Office Recurring Deposit (ಅಂಚೆ ಕಚೇರಿ ಆರ್‌ಡಿ)
- Start with as little as ₹100 per month at your local neighbourhood Post Office.
- 100% sovereign government guarantee — no chit fund owner or local middleman can run away with your money.
- Current interest rate: ~6.7% compounded quarterly.

#### 3. Warning Against Unregistered Chit Funds (ಅನಧಿಕೃತ ಚಿಟ್ ಫಂಡ್‌ಗಳು)
- Never deposit your daily savings with unregistered private chit fund operators or agents who promise "double money in 1 year".
- Registered post offices, district cooperative banks, and nationalized banks are safe and insured by DICGC up to ₹5 Lakhs.`,
    published: true,
  },
];

const quizzesData = [
  {
    lessonSlug: 'daily-wages-jandhan-upi',
    title: 'UPI & Cash Safety Quiz (ಯುಪಿಐ ಮತ್ತು ನಗದು ಭದ್ರತೆ ರಸಪ್ರಶ್ನೆ)',
    questions: [
      {
        question: 'When is entering your 4-digit or 6-digit UPI PIN required?',
        options: [
          'Only when transferring or sending money out of your account (ಹಣ ಕಳುಹಿಸುವಾಗ ಮಾತ್ರ)',
          'Whenever receiving money or daily wages from a contractor (ದಿನಗೂಲಿ ಹಣ ಪಡೆಯುವಾಗ)',
          'Whenever receiving government subsidy or PM-Kisan grant (ಸರ್ಕಾರಿ ಸಹಾಯಧನ ಪಡೆಯುವಾಗ)',
          'Every time a customer scans your QR code (ಗ್ರಾಹಕರು ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದಾಗ)',
        ],
        correctIndex: 0,
        explanation: 'Entering your UPI PIN is strictly for sending money OUT of your bank account. Receiving money or wage payments NEVER requires entering a PIN.',
      },
      {
        question: 'A customer scans your QR code and shows a green "Payment Successful ₹300" screen on their phone. What should you do?',
        options: [
          'Trust their screen immediately and let them walk away with the goods',
          'Wait for the Soundbox voice alert or check your bank SMS before letting them leave',
          'Ask them for their ATM card PIN',
          'Ask them to scan again without verifying',
        ],
        correctIndex: 1,
        explanation: 'Scammers use fake screenshot generator apps. Always rely only on your Soundbox voice announcement or your official bank SMS.',
      },
      {
        question: 'Can you open a zero-balance Jan Dhan bank account with just an Aadhaar card?',
        options: [
          'Yes, anyone can open it at zero balance with Aadhaar under PMJDY (ಹೌದು, ಉಚಿತವಾಗಿ ತೆರೆಯಬಹುದು)',
          'No, you must deposit at least ₹5,000 cash first',
          'No, only graduates can open bank accounts',
          'No, it requires high income tax documents',
        ],
        correctIndex: 0,
        explanation: 'Pradhan Mantri Jan Dhan Yojana allows any citizen/worker to open a zero-balance account with basic identity verification like Aadhaar.',
      },
    ],
  },
  {
    lessonSlug: 'meter-baddi-instant-loan-traps',
    title: 'Debt & Loan Safety Quiz (ಸಾಲ ಮತ್ತು ಮೀಟರ್ ಬಡ್ಡಿ ಜಾಗೃತಿ ರಸಪ್ರಶ್ನೆ)',
    questions: [
      {
        question: 'What is the danger of borrowing from a private "Meter Baddi" lender charging 10% per month?',
        options: [
          'It is completely risk-free and cheap',
          'It equals 120% interest per year, trapping you into paying interest indefinitely without clearing principal (ವರ್ಷಕ್ಕೆ 120% ಬಡ್ಡಿ ಬೀಳುತ್ತದೆ)',
          'The government pays the interest on your behalf',
          'Your bank balance automatically doubles',
        ],
        correctIndex: 1,
        explanation: 'A 10% monthly interest rate amounts to 120% annual interest, which creates a vicious debt cycle where the worker can never escape principal debt.',
      },
      {
        question: 'An unknown app on WhatsApp offers "Instant ₹5,000 loan without documents" but asks for full phone contacts access. What should you do?',
        options: [
          'Download and give all phone permissions immediately',
          'Do NOT install or borrow; illegal loan apps steal contacts and blackmail family with abusive calls (ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಡಿ, ಇದು ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್ ಜಾಲ)',
          'Send them your bank password and ATM PIN',
          'Forward the link to your friends and co-workers',
        ],
        correctIndex: 1,
        explanation: 'Illegal instant loan apps harass borrowers and their families by stealing contacts. Only borrow from RBI-registered banks or cooperative credit societies.',
      },
      {
        question: 'Which government scheme provides collateral-free working capital loans of ₹10,000 to ₹50,000 for street vendors at low interest?',
        options: [
          'PM SVANidhi Scheme (ಪಿಎಂ ಸ್ವನಿಧಿ ಯೋಜನೆ)',
          'Meter Baddi private lender',
          'Lottery Ticket scheme',
          'Credit card cash advance',
        ],
        correctIndex: 0,
        explanation: 'PM SVANidhi provides micro-credit to street vendors and hawkers at subsidized rates to help them grow their daily business without private loans.',
      },
    ],
  },
  {
    lessonSlug: 'govt-welfare-schemes-workers',
    title: 'Welfare Schemes Quiz (ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳ ರಸಪ್ರಶ್ನೆ)',
    questions: [
      {
        question: 'What is the monthly pension amount provided after age 60 under PM Shram Yogi Maan-dhan (PM-SYM)?',
        options: [
          '₹500 per month',
          '₹1,000 per month',
          '₹3,000 per month lifelong (ತಿಂಗಳಿಗೆ ₹3,000 ಜೀವಿತಾವಧಿ ಪಿಂಚಣಿ)',
          '₹20,000 per month',
        ],
        correctIndex: 2,
        explanation: 'PM-SYM guarantees a fixed monthly pension of ₹3,000 after 60 years of age for unorganized workers who contribute a nominal monthly sum matched by the government.',
      },
      {
        question: 'How much does PM Suraksha Bima Yojana (PMSBY) accident insurance cost per year?',
        options: [
          '₹20 per year for ₹2 Lakh coverage (ವರ್ಷಕ್ಕೆ ಕೇವಲ ₹20)',
          '₹1,000 per month',
          '₹5,000 one-time fee',
          'It is free only for government officers',
        ],
        correctIndex: 0,
        explanation: 'PMSBY provides ₹2 Lakh accident coverage for just ₹20 per year deducted automatically from your Jan Dhan or savings bank account.',
      },
    ],
  },
  {
    lessonSlug: 'daily-savings-post-office-gold-loan',
    title: 'Daily Savings Quiz (ದಿನನಿತ್ಯದ ಉಳಿತಾಯ ರಸಪ್ರಶ್ನೆ)',
    questions: [
      {
        question: 'If you save ₹30 each working day instead of spending on loose expenses, how much emergency cash do you build in a year?',
        options: [
          'About ₹10,800 cash reserve (ಸುಮಾರು ₹10,800 ತುರ್ತು ಹಣ)',
          'Less than ₹500',
          'Exactly ₹1,000',
          '₹0',
        ],
        correctIndex: 0,
        explanation: '₹30 per day adds up to ₹900 each month and nearly ₹10,800 a year, creating an emergency shield against medical and emergency expenses.',
      },
      {
        question: 'Where is the safest place to deposit small monthly savings with zero risk of the operator running away?',
        options: [
          'Unregistered private street chit funds',
          'Local Post Office RD or Nationalized Bank account (ಅಂಚೆ ಕಚೇರಿ ಅಥವಾ ಸರ್ಕಾರಿ ಬ್ಯಾಂಕ್)',
          'Unknown online betting games',
          'Giving cash to an unknown loan agent',
        ],
        correctIndex: 1,
        explanation: 'Post Office Recurring Deposits and bank accounts are 100% government backed and insured, unlike unregulated private chit funds.',
      },
    ],
  },
];

const tipsData = [
  { text: 'Never enter your UPI PIN to receive money or daily wages. PIN is strictly for paying out! (ಹಣ ಪಡೆಯಲು ಯುಪಿಐ ಪಿನ್ ಹಾಕಬೇಡಿ)', category: 'security' },
  { text: 'Avoid "Meter Baddi" private lenders who charge 10% monthly interest. Check PM SVANidhi or Bank Gold Loans instead.', category: 'credit' },
  { text: 'Save ₹30 to ₹50 from your daily earnings into a Post Office RD. In 1 year you will have over ₹10,000 emergency cash.', category: 'budgeting' },
  { text: 'Register for your free e-Shram card to get ₹2 Lakh accidental security and direct government emergency support.', category: 'investing' },
  { text: 'Share group meal and worksite expenses immediately with your co-workers to keep accounts clear and avoid misunderstandings.', category: 'social' },
];

export async function seedLearn() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB for Learn module seeding');

    for (const lData of lessonsData) {
      const lesson = await Lesson.findOneAndUpdate(
        { slug: lData.slug },
        lData,
        { upsert: true, new: true }
      );
      console.log(`Seeded lesson: ${lesson.title}`);

      // Seed quiz for this lesson
      const qData = quizzesData.find(q => q.lessonSlug === lData.slug);
      if (qData) {
        await Quiz.findOneAndUpdate(
          { lesson: lesson._id },
          {
            lesson: lesson._id,
            title: qData.title,
            questions: qData.questions,
            published: true,
          },
          { upsert: true, new: true }
        );
        console.log(`Seeded quiz for: ${lesson.title}`);
      }
    }

    for (const tData of tipsData) {
      await Tip.findOneAndUpdate(
        { text: tData.text },
        tData,
        { upsert: true, new: true }
      );
    }
    console.log('Seeded financial tips');

    console.log('Learn module seed completed successfully!');
    if (process.argv[1]?.includes('seedLearn.js')) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (err) {
    console.error('Learn seed failed:', err);
    if (process.argv[1]?.includes('seedLearn.js')) {
      process.exit(1);
    }
  }
}

if (process.argv[1]?.includes('seedLearn.js')) {
  seedLearn();
}
