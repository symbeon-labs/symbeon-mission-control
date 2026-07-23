/**
 * ID Generator for Symbeon Mission Control
 * Generates unique IDs for all entities following the pattern: PREFIX-000000
 */

const ID_PREFIXES = {
  TASK: 'TASK',
  MILESTONE: 'MS',
  DOCUMENT: 'DOC',
  DECISION: 'DEC',
  RELEASE: 'REL',
  EVIDENCE: 'EVD',
  STAKEHOLDER: 'STK',
  RISK: 'RISK',
  MEETING: 'MTG',
  APPROVAL: 'APR',
  PROJECT: 'PRJ',
  TIMELINE_EVENT: 'TLE'
};

/**
 * Generate a formatted ID with zero-padding
 * @param {string} prefix - The ID prefix (e.g., 'TASK')
 * @param {number} number - The sequential number
 * @returns {string} Formatted ID (e.g., 'TASK-000001')
 */
export function generateId(prefix, number) {
  const paddedNumber = String(number).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
}

/**
 * Parse an ID to extract prefix and number
 * @param {string} id - The ID to parse (e.g., 'TASK-000001')
 * @returns {object} Object with prefix and number
 */
export function parseId(id) {
  const [prefix, number] = id.split('-');
  return { prefix, number: parseInt(number, 10) };
}

/**
 * Get the next ID for a given entity type
 * @param {string} entityType - The entity type (e.g., 'TASK')
 * @param {number} currentNextId - The current next_id from storage
 * @returns {string} The generated ID
 */
export function getNextId(entityType, currentNextId) {
  const prefix = ID_PREFIXES[entityType];
  if (!prefix) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return generateId(prefix, currentNextId);
}

/**
 * Validate an ID format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid
 */
export function validateId(id) {
  const pattern = /^[A-Z]+-\d{6}$/;
  return pattern.test(id);
}

export default ID_PREFIXES;
