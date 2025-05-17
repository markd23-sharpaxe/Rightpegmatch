import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from 'lucide-react';
import { SalaryType } from '@shared/schema';

const HOURS_PER_WEEK = 40;
const WEEKS_PER_MONTH = 4.33;
const MONTHS_PER_YEAR = 12;

interface SalaryInputProps {
  defaultAmount?: string;
  defaultType?: SalaryType;
  defaultCurrency?: string;
  onHourlyRateChange: (hourlyRate: string) => void;
  onSalaryTypeChange: (salaryType: SalaryType) => void;
  onSalaryAmountChange: (amount: string) => void;
  onCurrencyChange?: (currency: string) => void;
}

// Currency options with proper symbols
const currencies = [
  { code: 'USD', symbol: '$', name: 'USD - US Dollar' },
  { code: 'EUR', symbol: '€', name: 'EUR - Euro' },
  { code: 'GBP', symbol: '£', name: 'GBP - British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'CAD - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'JPY - Japanese Yen' },
];

export default function SalaryInput({
  defaultAmount = '',
  defaultType = 'hourly',
  defaultCurrency = 'USD',
  onHourlyRateChange,
  onSalaryTypeChange,
  onSalaryAmountChange,
  onCurrencyChange = () => {},
}: SalaryInputProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [salaryType, setSalaryType] = useState<SalaryType>(defaultType);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [hourlyRate, setHourlyRate] = useState<string>('');

  // Calculate hourly rate whenever inputs change
  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount))) {
      setHourlyRate('');
      onHourlyRateChange('');
      return;
    }

    const numericAmount = parseFloat(amount);
    let calculatedHourlyRate: number;

    switch (salaryType) {
      case 'hourly':
        calculatedHourlyRate = numericAmount;
        break;
      case 'weekly':
        calculatedHourlyRate = numericAmount / HOURS_PER_WEEK;
        break;
      case 'monthly':
        calculatedHourlyRate = numericAmount / (HOURS_PER_WEEK * WEEKS_PER_MONTH);
        break;
      case 'yearly':
        calculatedHourlyRate = numericAmount / (HOURS_PER_WEEK * WEEKS_PER_MONTH * MONTHS_PER_YEAR);
        break;
      default:
        calculatedHourlyRate = numericAmount;
        break;
    }

    const roundedHourlyRate = calculatedHourlyRate.toFixed(2);
    setHourlyRate(roundedHourlyRate);
    onHourlyRateChange(roundedHourlyRate);
  }, [amount, salaryType, currency, onHourlyRateChange]);

  const handleAmountChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setAmount(sanitizedValue);
    onSalaryAmountChange(sanitizedValue);
  };

  const handleTypeChange = (value: SalaryType) => {
    setSalaryType(value);
    onSalaryTypeChange(value);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    onCurrencyChange(value);
  };

  const getEquivalentRates = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      return null;
    }

    const numericAmount = parseFloat(amount);
    let hourly, weekly, monthly, yearly;

    switch (salaryType) {
      case 'hourly':
        hourly = numericAmount;
        weekly = hourly * HOURS_PER_WEEK;
        monthly = weekly * WEEKS_PER_MONTH;
        yearly = monthly * MONTHS_PER_YEAR;
        break;
      case 'weekly':
        weekly = numericAmount;
        hourly = weekly / HOURS_PER_WEEK;
        monthly = weekly * WEEKS_PER_MONTH;
        yearly = monthly * MONTHS_PER_YEAR;
        break;
      case 'monthly':
        monthly = numericAmount;
        weekly = monthly / WEEKS_PER_MONTH;
        hourly = weekly / HOURS_PER_WEEK;
        yearly = monthly * MONTHS_PER_YEAR;
        break;
      case 'yearly':
        yearly = numericAmount;
        monthly = yearly / MONTHS_PER_YEAR;
        weekly = monthly / WEEKS_PER_MONTH;
        hourly = weekly / HOURS_PER_WEEK;
        break;
      default:
        return null;
    }

    const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0];
    const symbol = selectedCurrency.symbol;

    return {
      hourly: `${symbol}${hourly.toFixed(2)}`,
      weekly: `${symbol}${weekly.toFixed(2)}`,
      monthly: `${symbol}${monthly.toFixed(2)}`,
      yearly: `${symbol}${yearly.toFixed(2)}`,
    };
  };

  const equivalentRates = getEquivalentRates();
  const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">
              {selectedCurrency.symbol}
            </span>
            <Input
              id="amount"
              type="text"
              className="pl-7"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </div>
        </div>
        <div className="col-span-2">
          <Label htmlFor="salaryType">Per</Label>
          <Select 
            value={salaryType} 
            onValueChange={(value) => handleTypeChange(value as SalaryType)}
          >
            <SelectTrigger id="salaryType">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hour</SelectItem>
              <SelectItem value="weekly">Week</SelectItem>
              <SelectItem value="monthly">Month</SelectItem>
              <SelectItem value="yearly">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select 
          value={currency} 
          onValueChange={handleCurrencyChange}
        >
          <SelectTrigger id="currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display equivalent rates */}
      {equivalentRates && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-primary" />
            Equivalent Rates
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {salaryType !== 'hourly' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly:</span>
                <span className="font-medium">{equivalentRates.hourly}</span>
              </div>
            )}
            {salaryType !== 'weekly' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly:</span>
                <span className="font-medium">{equivalentRates.weekly}</span>
              </div>
            )}
            {salaryType !== 'monthly' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly:</span>
                <span className="font-medium">{equivalentRates.monthly}</span>
              </div>
            )}
            {salaryType !== 'yearly' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Yearly:</span>
                <span className="font-medium">{equivalentRates.yearly}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden hourly rate display for debugging */}
      {/* <div className="mt-2 text-xs text-gray-500">
        Calculated hourly rate: {hourlyRate}
      </div> */}
    </div>
  );
}