'use client'

import { Button } from '@/components/ui/button'
import { XLogo } from '@/components/ui/XLogo'
import { Facebook, Linkedin, Link as LinkIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url?: string
  title?: string
  shareText?: string
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  url, 
  title = 'Free Focus Games',
  shareText
}: ShareModalProps) {
  const t = useTranslations('common.shareModal')
  const [currentUrl, setCurrentUrl] = useState<string>(url || '')
  
  // 在客户端初始化时获取当前URL
  useEffect(() => {
    if (!url) {
      setCurrentUrl(window.location.href)
    }
  }, [url])
  
  if (!isOpen) return null

  // 使用当前URL状态，而不是直接访问window
  const shareUrl = currentUrl || ''
  const defaultShareText = t('defaultText')
  const finalShareText = shareText 
    ? `${shareText}\n\n${shareUrl}`
    : `${defaultShareText}\n\n${shareUrl}`

  const shareOptions = [
    {
      name: "X",
      icon: <XLogo className="w-4 h-4" />,
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalShareText)}`,
          "_blank"
        ),
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      onClick: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank"
        ),
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-4 h-4" />,
      onClick: () =>
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
          "_blank"
        ),
    },
    {
      name: t("copyLink"),
      icon: <LinkIcon className="w-4 h-4" />,
      onClick: () => {
        navigator.clipboard.writeText(shareUrl);
        alert(t("copied"));
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t("title")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className="gap-2"
              onClick={option.onClick}
            >
              {option.icon}
              {option.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
} 