import React, { useState } from 'react';
import LiveCameraMonitor from '../components/LiveCameraMonitor';

const ExamPage = () => {
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [answers, setAnswers] = useState({});

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            {/* Live Camera Monitor - Always Visible */}
            <LiveCameraMonitor />

            {/* Exam Content */}
            <div className="max-w-4xl mx-auto">
                {/* Exam Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0] mb-6">
                    <h1 className="text-2xl font-bold text-[#0F172A]">Database Management Final Exam</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                        <span>⏱️ Time Remaining: 45:30</span>
                        <span>📝 Question {currentQuestion} of 50</span>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0]">
                    <div className="mb-6">
                        <span className="text-sm font-bold text-[#64748B]">QUESTION {currentQuestion}</span>
                        <h2 className="text-xl font-medium text-[#0F172A] mt-2">
                            What is the primary key in a relational database?
                        </h2>
                    </div>

                    {/* MCQ Options */}
                    <div className="space-y-3">
                        {['A unique identifier for each record', 'A foreign key reference', 'An index column', 'A nullable field'].map((option, idx) => (
                            <label 
                                key={idx}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#0F172A] cursor-pointer transition-all"
                            >
                                <input 
                                    type="radio" 
                                    name="answer" 
                                    className="w-5 h-5"
                                    onChange={() => setAnswers({...answers, [currentQuestion]: option})}
                                />
                                <span className="text-[#0F172A]">{option}</span>
                            </label>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button 
                            onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
                            className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-[#F8FAFC]"
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                            className="px-6 py-3 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B]"
                        >
                            Next Question
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
