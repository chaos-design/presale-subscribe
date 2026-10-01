import { CampaignPageShell } from "@/components/campaign-page-shell"
import { SubscribeForm } from "@/components/subscribe-form"
import { getCampaignTemplateScheme } from "@/lib/campaign-template-schemes"
import type { PublicCampaign } from "@/types/database"

export function PublicCampaignExperience({ campaign }: { campaign: PublicCampaign }) {
  const scheme = getCampaignTemplateScheme(campaign.config.template)

  return (
    <CampaignPageShell
      config={campaign.config}
      slug={campaign.slug}
      renderMode="public"
      subscription={
        <SubscribeForm
          slug={campaign.slug}
          emailLabel={campaign.config.emailLabel}
          buttonLabel={campaign.config.buttonLabel}
          successMessage={campaign.config.successMessage}
          themeColor={campaign.config.themeColor}
          questionnaire={campaign.config.questionnaire}
          template={campaign.config.template}
          subscriptionLayout={scheme.layout.subscription}
          variant={scheme.tone}
        />
      }
    />
  )
}
