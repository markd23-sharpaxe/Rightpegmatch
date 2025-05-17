import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calculator, RefreshCw } from 'lucide-react';

// Standard work hours per week, month, and year
const HOURS_PER_WEEK = 40;
const WEEKS_PER_YEAR = 52;
const HOURS_PER_YEAR = HOURS_PER_WEEK * WEEKS_PER_YEAR;
const MONTHS_PER_YEAR = 12;

type SalaryType = 'hourly' | 'weekly' | 'monthly' | 'yearly';

interface SalaryConverterProps {
  defaultAmount?: number;
  defaultType?: SalaryType;
  defaultCurrency?: string;
  onHourlyRateChange?: (hourlyRate: number) => void;
}

export default function SalaryConverter({
  defaultAmount = 0,
  defaultType = 'hourly',
  defaultCurrency = 'USD',
  onHourlyRateChange
}: SalaryConverterProps) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [salaryType, setSalaryType] = useState<SalaryType>(defaultType);
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(HOURS_PER_WEEK);

  // Currencies supported by the converter
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  ];

  // Calculate hourly rate whenever inputs change
  useEffect(() => {
    let calculatedHourlyRate = 0;
    
    switch (salaryType) {
      case 'hourly':
        calculatedHourlyRate = amount;
        break;
      case 'weekly':
        calculatedHourlyRate = amount / hoursPerWeek;
        break;
      case 'monthly':
        calculatedHourlyRate = (amount * MONTHS_PER_YEAR) / HOURS_PER_YEAR;
        break;
      case 'yearly':
        calculatedHourlyRate = amount / HOURS_PER_YEAR;
        break;
    }
    
    setHourlyRate(calculatedHourlyRate);
    
    // Notify parent component if callback provided
    if (onHourlyRateChange) {
      onHourlyRateChange(calculatedHourlyRate);
    }
  }, [amount, salaryType, hoursPerWeek, onHourlyRateChange]);

  // Convert hourly rate to other time periods
  const getConvertedAmount = (targetType: SalaryType): number => {
    switch (targetType) {
      case 'hourly':
        return hourlyRate;
      case 'weekly':
        return hourlyRate * hoursPerWeek;
      case 'monthly':
        return hourlyRate * HOURS_PER_YEAR / MONTHS_PER_YEAR;
      case 'yearly':
        return hourlyRate * HOURS_PER_YEAR;
      default:
        return 0;
    }
  };

  // Format number to 2 decimal places
  const formatAmount = (value: number): string => {
    return value.toFixed(2);
  };

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    return currencies.find(c => c.code === currency)?.symbol || currency;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Salary Converter
        </CardTitle>
        <CardDescription>
          Convert between different salary types to find your hourly rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label htmlFor="salary-amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="salary-amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="salary-type" className="text-sm font-medium">
                Salary Type
              </label>
              <Select value={salaryType} onValueChange={(value) => setSalaryType(value as SalaryType)}>
                <SelectTrigger id="salary-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Hours per week</div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setHoursPerWeek(Math.max(1, hoursPerWeek - 5))}
                disabled={hoursPerWeek <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Math.max(1, parseInt(e.target.value) || HOURS_PER_WEEK))}
                className="w-20 text-center"
                min="1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setHoursPerWeek(Math.min(168, hoursPerWeek + 5))}
                disabled={hoursPerWeek >= 168}
              >
                +
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setHoursPerWeek(HOURS_PER_WEEK)}
                className="ml-2"
                title="Reset to standard 40 hours/week"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg mt-4">
            <div className="text-sm font-medium mb-2">Conversion Results</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hourly Rate:</span>
                <span className="font-medium">{getCurrencySymbol()} {formatAmount(getConvertedAmount('hourly'))}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Salary:</span>
                <span>{getCurrencySymbol()} {formatAmount(getConvertedAmount('weekly'))}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Salary:</span>
                <span>{getCurrencySymbol()} {formatAmount(getConvertedAmount('monthly'))}</span>
              </div>
              <div className="flex justify-between">
                <span>Yearly Salary:</span>
                <span>{getCurrencySymbol()} {formatAmount(getConvertedAmount('yearly'))}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}