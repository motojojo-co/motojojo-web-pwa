import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionnaireData {
  name: string;
  pronouns: string;
  phoneNumber: string;
  birthday: string;
  city: string;
  socialHandles: string;
  mood: string;
  roleInGroup: string;
  interests: string;
  artInspiration: string;
  beenToGathering: string;
  howFoundUs: string;
  whyJoinCommunity: string;
}

interface SubscriptionQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: QuestionnaireData) => void;
  planId: string;
  planName: string;
  amountInr: number;
}

const questions = [
  {
    id: 'name',
    title: "What should we call you?",
    subtitle: "Your name please",
    required: true,
    type: 'text',
    placeholder: 'Enter your name'
  },
  {
    id: 'pronouns',
    title: "You identify as?",
    subtitle: "optional",
    required: false,
    type: 'radio',
    options: ['He/him', 'She/her', 'They/Them', 'Prefer not to say', 'Other']
  },
  {
    id: 'phoneNumber',
    title: "Phone number",
    required: true,
    type: 'text',
    placeholder: 'Enter your phone number'
  },
  {
    id: 'birthday',
    title: "Birthday (MM/DD)",
    required: true,
    type: 'date',
    placeholder: 'MM/DD'
  },
  {
    id: 'city',
    title: "City you live in",
    subtitle: "so we know which gatherings are closer to you!",
    required: true,
    type: 'text',
    placeholder: 'Add your area and pin code too!'
  },
  {
    id: 'socialHandles',
    title: "Social Handles?",
    subtitle: "We'd love to check your vibe!",
    required: true,
    type: 'text',
    placeholder: 'Instagram, Twitter, etc.'
  },
  {
    id: 'mood',
    title: "If you were a mood, what mood would you be right now?",
    subtitle: "Feel free to describe your vibe in your own words in the 'Other' option below.",
    required: true,
    type: 'radio',
    options: [
      'A rainy evening with soft music (A quiet soul who enjoys soft and mindful evenings)',
      'Dancing barefoot in a stranger\'s living room (The social gathering lover)',
      'Deep conversation at 2 AM (One who likes intimate conversations with his close people)',
      'Wild poetry slams and chai (A creative human who has a thing for spontaneous art challenges)',
      'Other'
    ]
  },
  {
    id: 'roleInGroup',
    title: "What role do you often find yourself playing in a group?",
    required: true,
    type: 'radio',
    options: [
      'The quiet observer',
      'The enthusiastic connector',
      'The one who brings snacks and playlists',
      'The last one to leave',
      'A bit of everything',
      'Always a misfit :)',
      'Other'
    ]
  },
  {
    id: 'interests',
    title: "What do you do when you are not working?",
    subtitle: "Tell us your interests, hobbies, passions etc",
    required: true,
    type: 'textarea',
    placeholder: 'Share your interests and hobbies...'
  },
  {
    id: 'artInspiration',
    title: "Share a piece of art, music, or a quote that deeply moved you.",
    subtitle: "It tells us a lot about what kind of art inspires you",
    required: true,
    type: 'textarea',
    placeholder: 'Share what inspires you...'
  },
  {
    id: 'beenToGathering',
    title: "Have you ever been to a Motojojo gathering before?",
    required: true,
    type: 'radio',
    options: [
      'Yes',
      'Not yet but I have been following you',
      'Nope, but I love the concept'
    ]
  },
  {
    id: 'howFoundUs',
    title: "How did you find us?",
    required: true,
    type: 'radio',
    options: ['Instagram', 'A friend', 'I\'ve been to an event', 'Whatsapp group', 'Other']
  },
  {
    id: 'whyJoinCommunity',
    title: "Why do you want to be a part of the Motojojo community?",
    subtitle: "What do you seek? What is your intention? This question is more for you than for us :)",
    required: true,
    type: 'textarea',
    placeholder: 'Tell us your intentions and what you seek...'
  }
];

export default function SubscriptionQuestionnaire({
  isOpen,
  onClose,
  onComplete,
  planId,
  planName,
  amountInr
}: SubscriptionQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [data, setData] = useState<QuestionnaireData>({
    name: '',
    pronouns: '',
    phoneNumber: '',
    birthday: '',
    city: '',
    socialHandles: '',
    mood: '',
    roleInGroup: '',
    interests: '',
    artInspiration: '',
    beenToGathering: '',
    howFoundUs: '',
    whyJoinCommunity: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const validateCurrentQuestion = () => {
    const question = currentQuestion;
    if (!question.required) return true;

    const value = data[question.id as keyof QuestionnaireData];
    if (!value || value.trim() === '') {
      setErrors({ ...errors, [question.id]: 'This field is required' });
      return false;
    }

    // Additional validation for specific fields
    if (question.id === 'phoneNumber') {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(value)) {
        setErrors({ ...errors, [question.id]: 'Please enter a valid 10-digit phone number' });
        return false;
      }
    }

    if (question.id === 'birthday') {
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(value)) {
        setErrors({ ...errors, [question.id]: 'Please enter date in MM/DD format' });
        return false;
      }
    }

    setErrors({ ...errors, [question.id]: '' });
    return true;
  };

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        onComplete(data);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleInputChange = (value: string) => {
    setData({ ...data, [currentQuestion.id]: value });
    // Clear error when user starts typing
    if (errors[currentQuestion.id]) {
      setErrors({ ...errors, [currentQuestion.id]: '' });
    }
  };

  const renderQuestionInput = () => {
    const question = currentQuestion;
    const value = data[question.id as keyof QuestionnaireData];

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={question.placeholder}
            className="text-lg py-3"
          />
        );
      
      case 'date':
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={question.placeholder}
            className="text-lg py-3"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={question.placeholder}
            className="text-lg py-3 min-h-[120px]"
          />
        );
      
      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={handleInputChange}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-start space-x-3">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} className="mt-1" />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="text-base cursor-pointer leading-relaxed"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      default:
        return null;
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "You're doing great! 🎉",
      "Almost there! ✨",
      "Keep going! 💪",
      "You're amazing! 🌟",
      "So close! 🚀",
      "Fantastic progress! 🎯"
    ];
    return messages[currentQuestionIndex % messages.length];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-raspberry to-violet text-white">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-sandstorm mr-2" />
            <Sparkles className="h-6 w-6 text-yellow" />
          </div>
          <DialogTitle className="text-2xl font-bold text-sandstorm">
            Welcome to Motojojo Premium! 🎉
          </DialogTitle>
          <p className="text-white/80 mt-2">
            Let's get to know you better before we start this amazing journey together!
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/80">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-sandstorm">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 bg-white/20"
          />
          <p className="text-center text-sm text-yellow mt-2 font-medium">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-sandstorm mb-2">
            {currentQuestion.title}
            {currentQuestion.required && <span className="text-red-400 ml-1">*</span>}
          </h3>
          {currentQuestion.subtitle && (
            <p className="text-white/70 mb-4 text-sm">
              {currentQuestion.subtitle}
            </p>
          )}
          
          {renderQuestionInput()}
          
          {errors[currentQuestion.id] && (
            <p className="text-red-300 text-sm mt-2">
              {errors[currentQuestion.id]}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-white/20">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-white/60">
              {currentQuestionIndex + 1} of {questions.length} questions
            </p>
          </div>

          <Button
            onClick={handleNext}
            className={cn(
              "bg-gradient-to-r from-sandstorm to-yellow text-black font-bold px-6",
              currentQuestionIndex === questions.length - 1 && "from-green-400 to-green-500"
            )}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <>
                Complete & Subscribe
                <Heart className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Plan Info */}
        <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sandstorm">{planName}</p>
              <p className="text-sm text-white/70">Premium Subscription</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-yellow">₹{amountInr}</p>
              <p className="text-xs text-white/60">One-time payment</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
