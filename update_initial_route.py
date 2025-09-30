from pathlib import Path

path = Path('app/_layout.tsx')
text = path.read_text()
text = text.replace('  const [isReady, setIsReady] = useState(false);\n  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);\n', "  const [isReady, setIsReady] = useState(false);\n  const [initialRoute, setInitialRoute] = useState<string>('onboarding/index');\n")

text = text.replace('        if (FORCE_ONBOARDING_ENABLED || forceFromStorage) {\n          await clearOnboardingFlag();\n          setInitialRoute("onboarding/index");\n        } else {\n          const hasCompleted = await getHasCompletedOnboarding();\n          setInitialRoute(hasCompleted ? "(tabs)" : "onboarding/index");\n        }\n', '        if (FORCE_ONBOARDING_ENABLED || forceFromStorage) {\n          await clearOnboardingFlag();\n          setInitialRoute("onboarding/index");\n        } else {\n          const hasCompleted = await getHasCompletedOnboarding();\n          setInitialRoute(hasCompleted ? "(tabs)" : "onboarding/index");\n        }\n')
# No change there but kept.
path.write_text(text)
