import React from 'react';
import { useSubtitle } from '../context/SubtitleContext';
import { X, RotateCcw, Type, Palette, Eye, Sliders } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

export function SettingsPanel({ isOpen, onClose }) {
  const { settings, updateSetting, resetSettings } = useSubtitle();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="settings-panel">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetSettings}
              title="Reset to defaults"
              data-testid="reset-settings-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="close-settings-btn"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content with Tabs */}
        <Tabs defaultValue="appearance" className="p-6">
          <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="settings-tabs">
            <TabsTrigger value="appearance" data-testid="tab-appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="typography" data-testid="tab-typography">
              <Type className="w-4 h-4 mr-2" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="display" data-testid="tab-display">
              <Eye className="w-4 h-4 mr-2" />
              Display
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Subtitle Color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-300">Subtitle Color</Label>
              <div className="flex gap-2">
                {settings.colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSetting('fontColor', preset.value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      settings.fontColor === preset.value
                        ? 'border-blue-500 scale-110'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    data-testid={`color-${preset.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            {/* Background Opacity */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-zinc-300">Background Opacity</Label>
                <span className="text-sm text-zinc-400">{Math.round(settings.bgOpacity * 100)}%</span>
              </div>
              <Slider
                value={[settings.bgOpacity * 100]}
                onValueChange={([v]) => updateSetting('bgOpacity', v / 100)}
                min={0}
                max={100}
                step={5}
                className="w-full"
                data-testid="opacity-slider"
              />
            </div>

            {/* English Text Color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-300">English Text Color</Label>
              <div className="flex gap-2">
                {['#A1A1AA', '#FFFFFF', '#6B7280', '#9CA3AF'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSetting('englishColor', color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      settings.englishColor === color
                        ? 'border-blue-500 scale-110'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`english-color-${color.replace('#', '')}`}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            {/* Arabic Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-zinc-300">Arabic Font Size</Label>
                <span className="text-sm text-zinc-400">{settings.fontSize}px</span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([v]) => updateSetting('fontSize', v)}
                min={16}
                max={56}
                step={2}
                className="w-full"
                data-testid="font-size-slider"
              />
            </div>

            {/* Font Family */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-300">Arabic Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(v) => updateSetting('fontFamily', v)}
              >
                <SelectTrigger data-testid="font-family-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Height */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-zinc-300">Line Spacing</Label>
                <span className="text-sm text-zinc-400">{settings.lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.lineHeight * 10]}
                onValueChange={([v]) => updateSetting('lineHeight', v / 10)}
                min={10}
                max={25}
                step={1}
                className="w-full"
                data-testid="line-height-slider"
              />
            </div>

            {/* English Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-zinc-300">English Font Size</Label>
                <span className="text-sm text-zinc-400">{settings.englishFontSize}px</span>
              </div>
              <Slider
                value={[settings.englishFontSize]}
                onValueChange={([v]) => updateSetting('englishFontSize', v)}
                min={12}
                max={24}
                step={1}
                className="w-full"
                data-testid="english-font-size-slider"
              />
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-6">
            {/* Show English Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-zinc-300">Show English Text</Label>
                <p className="text-xs text-zinc-500 mt-1">Display source text above Arabic</p>
              </div>
              <Switch
                checked={settings.showEnglish}
                onCheckedChange={(v) => updateSetting('showEnglish', v)}
                data-testid="show-english-toggle"
              />
            </div>

            {/* Overlay Width */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-zinc-300">Overlay Width</Label>
                <span className="text-sm text-zinc-400">{settings.overlayWidth}px</span>
              </div>
              <Slider
                value={[settings.overlayWidth]}
                onValueChange={([v]) => updateSetting('overlayWidth', v)}
                min={400}
                max={1000}
                step={50}
                className="w-full"
                data-testid="overlay-width-slider"
              />
            </div>

            {/* Position Mode */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-zinc-300">Draggable Overlay</Label>
                <p className="text-xs text-zinc-500 mt-1">Allow moving the subtitle overlay</p>
              </div>
              <Switch
                checked={settings.overlayPosition === 'draggable'}
                onCheckedChange={(v) => updateSetting('overlayPosition', v ? 'draggable' : 'fixed')}
                data-testid="draggable-toggle"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="px-6 pb-6">
          <Label className="text-sm font-medium text-zinc-300 mb-3 block">Preview</Label>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${settings.bgOpacity})`,
            }}
            data-testid="settings-preview"
          >
            {settings.showEnglish && (
              <div
                className="px-4 pt-3 pb-1"
                style={{
                  fontSize: `${settings.englishFontSize}px`,
                  color: settings.englishColor,
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                This is a preview of English text.
              </div>
            )}
            <div
              className="arabic-text px-4 py-3"
              dir="rtl"
              style={{
                fontSize: `${settings.fontSize}px`,
                color: settings.fontColor,
                fontFamily: `'${settings.fontFamily}', 'Arial', sans-serif`,
                lineHeight: settings.lineHeight,
              }}
            >
              هذا معاينة للنص العربي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
