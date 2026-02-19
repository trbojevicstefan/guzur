import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'

const buildListingPrompt = (payload: movininTypes.SeoGeneratePayload) => {
  const amenities: string[] = []
  if (payload.furnished) {
    amenities.push('Furnished')
  }
  if (payload.petsAllowed) {
    amenities.push('Pets allowed')
  }
  if (payload.aircon) {
    amenities.push('Air conditioning')
  }
  if (typeof payload.kitchens === 'number') {
    amenities.push(`Kitchens: ${payload.kitchens}`)
  }
  if (typeof payload.parkingSpaces === 'number') {
    amenities.push(`Parking spaces: ${payload.parkingSpaces}`)
  }

  const parts = [
    `Name: ${payload.name}`,
    `Type: ${payload.type}`,
    payload.location ? `Location: ${payload.location}` : null,
    payload.bedrooms ? `Bedrooms: ${payload.bedrooms}` : null,
    payload.bathrooms ? `Bathrooms: ${payload.bathrooms}` : null,
    payload.size ? `Size: ${payload.size} sqm` : null,
    payload.listingType ? `Listing type: ${payload.listingType}` : null,
    payload.price ? `Rent price: ${payload.price}` : null,
    typeof payload.salePrice === 'number' ? `Sale price: ${payload.salePrice}` : null,
    payload.rentalTerm ? `Rental term: ${payload.rentalTerm}` : null,
    amenities.length > 0 ? `Amenities: ${amenities.join(', ')}` : null,
    `Description: ${payload.description}`,
  ].filter(Boolean)

  return parts.join('\n')
}

const buildProjectPrompt = (payload: movininTypes.SeoGeneratePayload) => {
  const parts = [
    `Project name: ${payload.name}`,
    payload.type ? `Project type: ${payload.type}` : null,
    payload.location ? `Location: ${payload.location}` : null,
    typeof payload.unitsCount === 'number' ? `Units count: ${payload.unitsCount}` : null,
    payload.developmentStatus ? `Project status: ${payload.developmentStatus}` : null,
    payload.completionDate ? `Completion date: ${payload.completionDate}` : null,
    `Description: ${payload.description}`,
  ].filter(Boolean)

  return parts.join('\n')
}

export const generateSeo = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.SeoGeneratePayload } = req

  try {
    if (!env.OPENAI_API_KEY) {
      res.status(400).send('OpenAI API key not configured')
      return
    }

    const contextType = body?.contextType === 'project' ? 'project' : 'listing'
    if (!body?.name || !body?.description || (contextType === 'listing' && !body?.type)) {
      res.status(400).send('Invalid SEO payload')
      return
    }

    const prompt = contextType === 'project' ? buildProjectPrompt(body) : buildListingPrompt(body)
    const systemMessage = contextType === 'project'
      ? 'Return JSON only. Create SEO fields for a real estate project/development page.'
      : 'Return JSON only. Create SEO fields for a real estate listing.'
    const userInstructions = contextType === 'project'
      ? [
          'Generate SEO fields:',
          '- seoTitle: concise title, max 70 chars',
          '- seoDescription: meta description, max 160 chars',
          '- seoKeywords: array of 5-10 keywords',
          '- aiDescription: full project description, 140-240 words, SEO-optimized, buyer and investor friendly, include location advantages and project highlights',
          '',
          'Project:',
          prompt,
        ].join('\n')
      : [
          'Generate SEO fields:',
          '- seoTitle: concise title, max 70 chars',
          '- seoDescription: meta description, max 160 chars',
          '- seoKeywords: array of 5-10 keywords',
          '- aiDescription: full listing description, 120-200 words, buyer-facing, highlight key amenities and location',
          '',
          'Listing:',
          prompt,
        ].join('\n')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: userInstructions,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('[seo.generate] OpenAI error', errorText)
      res.status(400).send('Failed to generate SEO')
      return
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      res.status(400).send('Failed to generate SEO')
      return
    }

    const parsed = JSON.parse(content) as movininTypes.SeoGenerateResult
    if (!parsed.seoTitle || !parsed.seoDescription || !Array.isArray(parsed.seoKeywords) || !parsed.aiDescription) {
      res.status(400).send('Invalid SEO response')
      return
    }

    res.json(parsed)
  } catch (err) {
    logger.error(`[seo.generate] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
