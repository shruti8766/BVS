// FAQ Component
import React, { useState } from 'react';

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqItems = [
    {
      question: "What do you supply?",
      answer: "Vegetables, fruits, grains, pulses, and banana leaves for complete kitchen needs."
    },
    {
      question: "Who do you serve?",
      answer: "Hotels, canteens, caterers, and stores across Pune with bulk and daily supply."
    },
    {
      question: "How do I get today's price list?",
      answer: "We do not have a fixed price list. Prices depend on daily market rates and change regularly. Please call or WhatsApp BVS to get today’s live wholesale prices."
    },
    {
      question: "Do you offer same-day delivery?",
      answer: "No. We do not offer same-day delivery. Please place your order at least one day in advance so we can source fresh produce and schedule dispatch."
    },
    {
      question: "Where are you located?",
      answer: "Gultekdi, Market Yard, Pune — 411037."
    },
    {
      question: "Can I place standing daily orders?",
      answer: "Yes, we can schedule standing daily or weekly orders for hotels, canteens, and caterers. Please note that we are closed on Saturdays."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-green-100 rounded-full mb-4">
            <span className="text-green-700 font-semibold text-sm tracking-wide uppercase">
              Support
            </span>
          </div>
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-green-600 text-lg max-w-2xl mx-auto">
            Everything you need to know about BVS supplies and services
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className={`
                group bg-white rounded-2xl shadow-sm hover:shadow-lg 
                transition-all duration-300 overflow-hidden border-2
                ${activeIndex === index 
                  ? 'border-green-500 shadow-green-100' 
                  : 'border-green-100 hover:border-green-300'
                }
              `}
            >
              <button
                className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span className={`
                  text-lg font-semibold transition-colors duration-300
                  ${activeIndex === index ? 'text-green-700' : 'text-green-900'}
                `}>
                  {item.question}
                </span>
                
                {/* Icon with rotation animation */}
                <div className={`
                  flex-shrink-0 ml-4 w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${activeIndex === index 
                    ? 'bg-green-600 rotate-180' 
                    : 'bg-green-100 group-hover:bg-green-200'
                  }
                `}>
                  <svg 
                    className={`w-5 h-5 transition-colors duration-300 ${
                      activeIndex === index ? 'text-white' : 'text-green-700'
                    }`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </div>
              </button>

              {/* Answer with smooth slide animation */}
              <div 
                className={`
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="px-8 pb-6 pt-2">
                  <div className="pl-4 border-l-4 border-green-400">
                    <p className="text-green-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
