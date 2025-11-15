/**
 * Service to fetch Figma components from the MCP server
 * This service interacts with the Figma MCP server to get selected components
 */

/**
 * Fetches selected Figma components and converts them to editor components
 * @returns {Promise<Array>} Array of component objects for the ComponentMenu
 */
export const getSelectedFigmaComponents = async () => {
  try {
    // In a real implementation, this would call the MCP server
    // For now, we return an empty array as the MCP integration
    // will be handled at the Editor level
    console.log('Figma service: Ready to fetch components from MCP server');
    return [];
  } catch (error) {
    console.error('Error fetching Figma components:', error);
    return [];
  }
};

/**
 * Converts Figma node data to editor component format
 * @param {Object} figmaNode - Figma node data from MCP
 * @returns {Object} Component object for ComponentMenu
 */
export const convertFigmaNodeToComponent = (figmaNode) => {
  // Extract category from node name or properties
  const category = figmaNode.name || 'contentbox';
  const label = figmaNode.name || 'Content-Box';
  
  return {
    type: 'contentbox',
    label: label,
    icon: '📦',
    figmaNodeId: figmaNode.id,
    category: category.toLowerCase().replace(/\s+/g, '-'),
  };
};

