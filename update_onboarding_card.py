from pathlib import Path

path = Path('app/onboarding/index.tsx')
lines = path.read_text().splitlines()

start = None
end = None
for idx, line in enumerate(lines):
    if start is None and 'const Icon = iconMap[item.icon];' in line:
        start = idx
    if start is not None and line.strip() == '{showPermissionCta && (':
        end = idx
        break

if start is None or end is None:
    raise SystemExit('Could not locate block to replace')

replacement = [
    "  const Icon = iconMap[item.icon];",
    "  const showPermissionCta = Boolean(item.requiresPermission);",
    "  const isWelcomeVariant = item.variant === 'welcome';",
    "",
    "  return (",
    "    <View style={[styles.slideContainer, { width }]}> ",
    "      <View style={styles.slideCard}>",
    "        {isWelcomeVariant ? (",
    "          <Image",
    "            source={welcomeLogo}",
    "            style={styles.welcomeGraphic}",
    "            accessibilityRole=\"image\"",
    "            accessibilityLabel=\"MyPlantScan logo\"",
    "            accessibilityIgnoresInvertColors",
    "          />",
    "        ) : (",
    "          Icon && (",
    "            <View style={[styles.iconBadge, { backgroundColor: item.accent }]}>",
    "              <Icon size={40} color={Colors.white} strokeWidth={2} />",
    "            </View>",
    "          )",
    "        )}",
    "",
    '        <Text style={[styles.slideTitle, isWelcomeVariant && styles.welcomeTitle]}>',
    "          {item.title}",
    "        </Text>",
    "        <Text",
    '          style={[styles.slideDescription, isWelcomeVariant && styles.welcomeDescription]}',
    "        >",
    "          {item.description}",
    "        </Text>",
    "",
    "        {showPermissionCta && (",
]

updated_lines = lines[:start] + replacement + lines[end+1:]
path.write_text('\n'.join(updated_lines) + '\n')
