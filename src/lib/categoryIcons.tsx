import { 
  UtensilsCrossed, 
  Car, 
  Gamepad2, 
  ShoppingBag, 
  Receipt, 
  MoreHorizontal,
  ShoppingCart,
  Users,
  Fuel,
  Bus,
  Shirt,
  Smartphone,
  Home,
  Zap,
  Wifi,
  Shield,
  Heart,
  GraduationCap,
  Plane,
  Dumbbell,
  Scissors,
  Gift,
  HandHeart,
  Briefcase
} from 'lucide-react';
import { ExpenseCategory } from '@/types/expense';

export const categoryIcons = {
  Food: UtensilsCrossed,
  Groceries: ShoppingCart,
  'Dining Out': Users,
  Transportation: Car,
  'Gas/Fuel': Fuel,
  'Public Transport': Bus,
  Entertainment: Gamepad2,
  Shopping: ShoppingBag,
  Clothing: Shirt,
  Electronics: Smartphone,
  Bills: Receipt,
  'Rent/Mortgage': Home,
  Utilities: Zap,
  'Internet/Phone': Wifi,
  Insurance: Shield,
  Healthcare: Heart,
  Education: GraduationCap,
  Travel: Plane,
  'Fitness/Sports': Dumbbell,
  'Personal Care': Scissors,
  Gifts: Gift,
  Charity: HandHeart,
  Business: Briefcase,
  Other: MoreHorizontal,
};

export const categoryColors = {
  Food: {
    bg: 'bg-green-500',
    text: 'text-green-400',
    light: 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30',
  },
  Groceries: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    light: 'bg-emerald-500 bg-opacity-20 text-emerald-400 border border-emerald-500 border-opacity-30',
  },
  'Dining Out': {
    bg: 'bg-lime-500',
    text: 'text-lime-400',
    light: 'bg-lime-500 bg-opacity-20 text-lime-400 border border-lime-500 border-opacity-30',
  },
  Transportation: {
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    light: 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30',
  },
  'Gas/Fuel': {
    bg: 'bg-orange-500',
    text: 'text-orange-400',
    light: 'bg-orange-500 bg-opacity-20 text-orange-400 border border-orange-500 border-opacity-30',
  },
  'Public Transport': {
    bg: 'bg-cyan-500',
    text: 'text-cyan-400',
    light: 'bg-cyan-500 bg-opacity-20 text-cyan-400 border border-cyan-500 border-opacity-30',
  },
  Entertainment: {
    bg: 'bg-purple-500',
    text: 'text-purple-400',
    light: 'bg-purple-500 bg-opacity-20 text-purple-400 border border-purple-500 border-opacity-30',
  },
  Shopping: {
    bg: 'bg-pink-500',
    text: 'text-pink-400',
    light: 'bg-pink-500 bg-opacity-20 text-pink-400 border border-pink-500 border-opacity-30',
  },
  Clothing: {
    bg: 'bg-rose-500',
    text: 'text-rose-400',
    light: 'bg-rose-500 bg-opacity-20 text-rose-400 border border-rose-500 border-opacity-30',
  },
  Electronics: {
    bg: 'bg-indigo-500',
    text: 'text-indigo-400',
    light: 'bg-indigo-500 bg-opacity-20 text-indigo-400 border border-indigo-500 border-opacity-30',
  },
  Bills: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    light: 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30',
  },
  'Rent/Mortgage': {
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    light: 'bg-amber-500 bg-opacity-20 text-amber-400 border border-amber-500 border-opacity-30',
  },
  Utilities: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-400',
    light: 'bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30',
  },
  'Internet/Phone': {
    bg: 'bg-teal-500',
    text: 'text-teal-400',
    light: 'bg-teal-500 bg-opacity-20 text-teal-400 border border-teal-500 border-opacity-30',
  },
  Insurance: {
    bg: 'bg-violet-500',
    text: 'text-violet-400',
    light: 'bg-violet-500 bg-opacity-20 text-violet-400 border border-violet-500 border-opacity-30',
  },
  Healthcare: {
    bg: 'bg-red-600',
    text: 'text-red-300',
    light: 'bg-red-600 bg-opacity-20 text-red-300 border border-red-600 border-opacity-30',
  },
  Education: {
    bg: 'bg-blue-600',
    text: 'text-blue-300',
    light: 'bg-blue-600 bg-opacity-20 text-blue-300 border border-blue-600 border-opacity-30',
  },
  Travel: {
    bg: 'bg-sky-500',
    text: 'text-sky-400',
    light: 'bg-sky-500 bg-opacity-20 text-sky-400 border border-sky-500 border-opacity-30',
  },
  'Fitness/Sports': {
    bg: 'bg-green-600',
    text: 'text-green-300',
    light: 'bg-green-600 bg-opacity-20 text-green-300 border border-green-600 border-opacity-30',
  },
  'Personal Care': {
    bg: 'bg-pink-600',
    text: 'text-pink-300',
    light: 'bg-pink-600 bg-opacity-20 text-pink-300 border border-pink-600 border-opacity-30',
  },
  Gifts: {
    bg: 'bg-purple-600',
    text: 'text-purple-300',
    light: 'bg-purple-600 bg-opacity-20 text-purple-300 border border-purple-600 border-opacity-30',
  },
  Charity: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-300',
    light: 'bg-emerald-600 bg-opacity-20 text-emerald-300 border border-emerald-600 border-opacity-30',
  },
  Business: {
    bg: 'bg-slate-600',
    text: 'text-slate-300',
    light: 'bg-slate-600 bg-opacity-20 text-slate-300 border border-slate-600 border-opacity-30',
  },
  Other: {
    bg: 'bg-slate-500',
    text: 'text-slate-400',
    light: 'bg-slate-500 bg-opacity-20 text-slate-400 border border-slate-500 border-opacity-30',
  },
};

export function getCategoryIcon(category: ExpenseCategory | string) {
  return categoryIcons[category as ExpenseCategory] || categoryIcons.Other;
}

export function getCategoryColor(category: ExpenseCategory | string) {
  return categoryColors[category as ExpenseCategory] || categoryColors.Other;
}