import convert from 'convert-units'
import Fraction from 'fraction.js'

export type MeasurementSystem = 'metric' | 'imperial' | 'us'

export interface ConvertedMeasurement {
  quantity: number
  unit: string
  displayQuantity: string
  originalQuantity?: number
  originalUnit?: string
  originalDisplayQuantity?: string
}

const unitMappings = {
  metric: {
    volume: ['ml', 'l', 'cl', 'dl'],
    weight: ['g', 'kg'],
    length: ['mm', 'cm', 'm'],
    temperature: ['C']
  },
  us: {
    volume: ['tsp', 'tbsp', 'fl-oz', 'cup', 'pnt', 'qt', 'gal'],
    weight: ['oz', 'lb'],
    length: ['in', 'ft'],
    temperature: ['F']
  },
  imperial: {
    volume: ['tsp', 'tbsp', 'fl-oz', 'cup', 'pnt', 'qt', 'gal'],
    weight: ['oz', 'lb'],
    length: ['in', 'ft'],
    temperature: ['F']
  }
}

// Common cooking unit conversions that make sense
const cookingConversions = {
  // Volume conversions
  'cup': { metric: { amount: 250, unit: 'ml' }, us: { amount: 1, unit: 'cup' }, imperial: { amount: 1, unit: 'cup' } },
  'cups': { metric: { amount: 250, unit: 'ml' }, us: { amount: 1, unit: 'cup' }, imperial: { amount: 1, unit: 'cup' } },
  'fl-oz': { metric: { amount: 30, unit: 'ml' }, us: { amount: 1, unit: 'fl oz' }, imperial: { amount: 1, unit: 'fl oz' } },
  'fluid ounce': { metric: { amount: 30, unit: 'ml' }, us: { amount: 1, unit: 'fl oz' }, imperial: { amount: 1, unit: 'fl oz' } },
  'fluid ounces': { metric: { amount: 30, unit: 'ml' }, us: { amount: 1, unit: 'fl oz' }, imperial: { amount: 1, unit: 'fl oz' } },
  'ml': { metric: { amount: 1, unit: 'ml' }, us: { amount: 1/30, unit: 'fl oz' }, imperial: { amount: 1/30, unit: 'fl oz' } },
  'l': { metric: { amount: 1, unit: 'l' }, us: { amount: 4, unit: 'cups' }, imperial: { amount: 4, unit: 'cups' } },
  'liter': { metric: { amount: 1, unit: 'l' }, us: { amount: 4, unit: 'cups' }, imperial: { amount: 4, unit: 'cups' } },
  'liters': { metric: { amount: 1, unit: 'l' }, us: { amount: 4, unit: 'cups' }, imperial: { amount: 4, unit: 'cups' } },
  
  // Weight conversions
  'g': { metric: { amount: 1, unit: 'g' }, us: { amount: 1/28, unit: 'oz' }, imperial: { amount: 1/28, unit: 'oz' } },
  'gram': { metric: { amount: 1, unit: 'g' }, us: { amount: 1/28, unit: 'oz' }, imperial: { amount: 1/28, unit: 'oz' } },
  'grams': { metric: { amount: 1, unit: 'g' }, us: { amount: 1/28, unit: 'oz' }, imperial: { amount: 1/28, unit: 'oz' } },
  'kg': { metric: { amount: 1, unit: 'kg' }, us: { amount: 2.2, unit: 'lb' }, imperial: { amount: 2.2, unit: 'lb' } },
  'kilogram': { metric: { amount: 1, unit: 'kg' }, us: { amount: 2.2, unit: 'lb' }, imperial: { amount: 2.2, unit: 'lb' } },
  'kilograms': { metric: { amount: 1, unit: 'kg' }, us: { amount: 2.2, unit: 'lb' }, imperial: { amount: 2.2, unit: 'lb' } },
  'oz': { metric: { amount: 28, unit: 'g' }, us: { amount: 1, unit: 'oz' }, imperial: { amount: 1, unit: 'oz' } },
  'ounce': { metric: { amount: 28, unit: 'g' }, us: { amount: 1, unit: 'oz' }, imperial: { amount: 1, unit: 'oz' } },
  'ounces': { metric: { amount: 28, unit: 'g' }, us: { amount: 1, unit: 'oz' }, imperial: { amount: 1, unit: 'oz' } },
  'lb': { metric: { amount: 450, unit: 'g' }, us: { amount: 1, unit: 'lb' }, imperial: { amount: 1, unit: 'lb' } },
  'pound': { metric: { amount: 450, unit: 'g' }, us: { amount: 1, unit: 'lb' }, imperial: { amount: 1, unit: 'lb' } },
  'pounds': { metric: { amount: 450, unit: 'g' }, us: { amount: 1, unit: 'lb' }, imperial: { amount: 1, unit: 'lb' } }
}

export const convertMeasurement = (
  quantity: number,
  fromUnit: string,
  toSystem: MeasurementSystem
): ConvertedMeasurement | null => {
  if (!quantity || !fromUnit) return null

  try {
    const normalizedFromUnit = normalizeUnit(fromUnit)
    const conversion = cookingConversions[normalizedFromUnit as keyof typeof cookingConversions]
    
    if (conversion && conversion[toSystem]) {
      const targetConversion = conversion[toSystem]
      const convertedQuantity = quantity * targetConversion.amount
      
      // Round to sensible precision
      const roundedQuantity = roundToSensiblePrecision(convertedQuantity)
      
      // Only include original values if the unit actually changed
      const unitChanged = targetConversion.unit !== fromUnit
      
      if (unitChanged) {
        return {
          quantity: roundedQuantity,
          unit: targetConversion.unit,
          displayQuantity: formatQuantity(roundedQuantity),
          originalQuantity: quantity,
          originalUnit: fromUnit,
          originalDisplayQuantity: formatQuantity(quantity)
        }
      } else {
        // No conversion needed, return original
        return {
          quantity,
          unit: fromUnit,
          displayQuantity: formatQuantity(quantity)
        }
      }
    }
    
    // If no conversion available, return original
    return {
      quantity,
      unit: fromUnit,
      displayQuantity: formatQuantity(quantity)
    }
  } catch (error) {
    console.warn('Conversion failed:', error)
    return {
      quantity,
      unit: fromUnit,
      displayQuantity: formatQuantity(quantity)
    }
  }
}

export const scaleRecipe = (
  quantity: number,
  scaleFactor: number
): { quantity: number; displayQuantity: string } => {
  const scaledQuantity = quantity * scaleFactor
  const roundedQuantity = roundToSensiblePrecision(scaledQuantity)
  return {
    quantity: roundedQuantity,
    displayQuantity: formatQuantity(roundedQuantity)
  }
}

export const formatQuantity = (quantity: number, useFractions: boolean = true): string => {
  if (quantity === 0) return '0'
  
  // Round to sensible precision first
  const rounded = roundToSensiblePrecision(quantity)
  
  if (!useFractions) {
    return rounded.toString()
  }
  
  try {
    const fraction = new Fraction(rounded)
    
    // If it's a whole number, return as is
    if (fraction.d === 1) {
      return fraction.n.toString()
    }
    
    // If it's less than 1, show as fraction
    if (rounded < 1) {
      return fraction.toFraction(true)
    }
    
    // If it has a simple fractional part, show mixed number
    if (fraction.d <= 16) {
      const wholePart = Math.floor(rounded)
      const fractionalPart = fraction.sub(wholePart)
      
      if (fractionalPart.n === 0) {
        return wholePart.toString()
      }
      
      return `${wholePart} ${fractionalPart.toFraction(true)}`
    }
    
    // Otherwise, show as decimal rounded to 1 place
    return parseFloat(rounded.toFixed(1)).toString()
  } catch (error) {
    // Fallback to decimal
    return parseFloat(rounded.toFixed(1)).toString()
  }
}

const roundToSensiblePrecision = (value: number): number => {
  // For very small values, round to 2 decimal places
  if (value < 1) {
    return Math.round(value * 100) / 100
  }
  
  // For values 1-10, round to 1 decimal place
  if (value < 10) {
    return Math.round(value * 10) / 10
  }
  
  // For larger values, round to nearest whole number
  return Math.round(value)
}

const normalizeUnit = (unit: string): string => {
  const unitMap: { [key: string]: string } = {
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'cups': 'cup',
    'ounce': 'oz',
    'ounces': 'oz',
    'fluid ounce': 'fl-oz',
    'fluid ounces': 'fl-oz',
    'pound': 'lb',
    'pounds': 'lb',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'millilitre': 'ml',
    'millilitres': 'ml',
    'liter': 'l',
    'liters': 'l',
    'litre': 'l',
    'litres': 'l'
  }
  
  return unitMap[unit.toLowerCase()] || unit.toLowerCase()
}