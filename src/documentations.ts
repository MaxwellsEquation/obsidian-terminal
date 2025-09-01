import {
	DocumentationMarkdownView,
	StorageSettingsManager,
	addCommand,
	anyToError,
	deepFreeze,
	printError,
	typedKeys,
} from "@polyipseity/obsidian-plugin-library"
import type { TerminalPlugin } from "./main.js"
import changelogMd from "../CHANGELOG.md"
import readmeMd from "../README.md"
import semverLt from "semver/functions/lt.js"

export const DOCUMENTATIONS = deepFreeze({
	async changelog(view: DocumentationMarkdownView.Registered, active: boolean) {
		await view.open(active, {
			data: await changelogMd,
			displayTextI18nKey: "translation:generic.documentations.changelog",
			iconI18nKey: "asset:generic.documentations.changelog-icon",
		})
	},
	async readme(view: DocumentationMarkdownView.Registered, active: boolean) {
		await view.open(active, {
			data: await readmeMd,
			displayTextI18nKey: "translation:generic.documentations.readme",
			iconI18nKey: "asset:generic.documentations.readme-icon",
		})
	},
})
export type DocumentationKeys = readonly ["changelog", "readme"]
export const DOCUMENTATION_KEYS = typedKeys<DocumentationKeys>()(DOCUMENTATIONS)

class Loaded0 {
	public constructor(
		public readonly context: TerminalPlugin,
		public readonly docMdView: DocumentationMarkdownView.Registered,
	) { }

	public open(key: DocumentationKeys[number], active = true): void {
		const {
			context,
			context: { version, language: { value: i18n }, localSettings },
			docMdView,
		} = this;
		(async (): Promise<void> => {
			try {
				await DOCUMENTATIONS[key](docMdView, active)
				if (key === "changelog" && version !== null) {
					localSettings.mutate(lsm => {
						lsm.lastReadChangelogVersion = version
					}).then(async () => localSettings.write())
						.catch((error: unknown) => { self.console.error(error) })
				}
			} catch (error) {
				printError(
					anyToError(error),
					() => i18n.t("errors.error-opening-documentation"),
					context,
				)
			}
		})()
	}
}
export function loadDocumentations(
	context: TerminalPlugin,
	readme = false,
): loadDocumentations.Loaded {
	const
		{
			version,
			language: { value: i18n },
			localSettings,
			settings,
		} = context,
		ret = new Loaded0(
			context,
			DocumentationMarkdownView.register(context),
		)
	for (const doc of DOCUMENTATION_KEYS) {
		addCommand(context, () => i18n.t(`commands.open-documentation-${doc}`), {
			callback() { ret.open(doc) },
			icon: i18n.t(`asset:commands.open-documentation-${doc}-icon`),
			id: `open-documentation.${doc}`,
		})
	}
	if (readme) { ret.open("readme", false) }
	if (version !== null &&
		settings.value.openChangelogOnUpdate &&
		!StorageSettingsManager.hasFailed(localSettings.value) &&
		semverLt(localSettings.value.lastReadChangelogVersion, version)) {
		ret.open("changelog", false)
	}
	return ret
}
export namespace loadDocumentations {
	export type Loaded = Loaded0
}
