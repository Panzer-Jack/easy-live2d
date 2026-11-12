function countMaskGroups(masks: Int32Array[]): number {
  const groups = new Set<string>()
  for (const mask of masks) {
    // Cubism shares one clipping context for the same drawable IDs, in any order.
    if (mask.length > 0)
      groups.add(mask.slice().sort().join(','))
  }
  return groups.size
}

export function getMaskBufferCount(drawableMasks: Int32Array[], offscreenMasks: Int32Array[]): number {
  // Each atlas gets the same buffer count. One texture fits 36 groups, multiple textures fit 32 each.
  const groups = Math.max(countMaskGroups(drawableMasks), countMaskGroups(offscreenMasks))
  return groups <= 36 ? 1 : Math.ceil(groups / 32)
}
