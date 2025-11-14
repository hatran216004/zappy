import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onboardingSteps } from '@/hooks/useOnboarding';
import { createPortal } from 'react-dom';

interface OnboardingTourProps {
  currentStep: number;
  isActive: boolean;
  showCompletionBanner?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onDismissBanner?: () => void;
}

export default function OnboardingTour({
  currentStep,
  isActive,
  showCompletionBanner = false,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onDismissBanner
}: OnboardingTourProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  // Tìm và highlight element
  useEffect(() => {
    if (!isActive || !step) {
      setHighlightRect(null);
      setTooltipPosition(null);
      return;
    }

    let retryTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const updateHighlight = () => {
      if (!isMounted) return false;

      let element: HTMLElement | null = null;

      // Tìm element theo selector
      if (step.target === 'body') {
        element = document.body;
      } else {
        element = document.querySelector(step.target);
      }

      if (!element) {
        return false;
      }

      // Kiểm tra element có visible không
      const computedStyle = window.getComputedStyle(element);
      const isVisible =
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        computedStyle.opacity !== '0';

      if (!isVisible && step.target !== 'body') {
        return false;
      }

      // Kiểm tra element có kích thước hợp lệ không
      const rect = element.getBoundingClientRect();

      // Nếu element có kích thước 0x0, đợi thêm một chút để element render xong
      if (rect.width === 0 && rect.height === 0 && step.target !== 'body') {
        return false;
      }

      // Lấy vị trí của element
      if (isMounted) {
        setHighlightRect(rect);

        // Tính toán vị trí tooltip
        const position = calculateTooltipPosition(
          rect,
          step.position || 'bottom'
        );
        setTooltipPosition(position);
      }
      return true;
    };

    // Retry logic: thử tìm element với delay
    let retryCount = 0;
    const maxRetries = 20;
    const retryDelay = 150;

    const tryUpdateHighlight = () => {
      if (!isMounted) return;

      const success = updateHighlight();

      if (!success && retryCount < maxRetries && isMounted) {
        retryCount++;
        retryTimeout = setTimeout(tryUpdateHighlight, retryDelay);
      }
    };

    // Thử ngay lập tức
    const immediateSuccess = updateHighlight();

    // Nếu không tìm thấy ngay, bắt đầu retry
    if (!immediateSuccess) {
      retryTimeout = setTimeout(tryUpdateHighlight, 100);
    }

    // Update khi scroll hoặc resize
    const handleScroll = () => {
      if (isMounted) updateHighlight();
    };
    const handleResize = () => {
      if (isMounted) {
        updateHighlight();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, step, currentStep]);

  // Effect riêng để điều chỉnh tooltip position sau khi render
  // Chỉ điều chỉnh khi thực sự cần (tooltip đè lên element hoặc tràn viewport)
  useEffect(() => {
    if (!tooltipPosition || !tooltipRef.current || !step) return;
    if (step.target === 'body') return; // Không cần adjust cho welcome modal

    const adjustPosition = () => {
      if (!tooltipRef.current || !tooltipPosition || !step) return;

      const tooltip = tooltipRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 20;
      const minDistance = 40; // Khoảng cách tối thiểu từ element

      // Lấy vị trí hiện tại từ DOM
      const currentLeft =
        parseFloat(tooltip.style.left) || tooltipPosition.left;
      const currentTop = parseFloat(tooltip.style.top) || tooltipPosition.top;

      // Tìm element được highlight
      const targetElement = document.querySelector(step.target);
      if (!targetElement) return;

      const targetRect = targetElement.getBoundingClientRect();

      // Tooltip edges (với transform -50%)
      const tooltipLeftEdge = currentLeft - tooltipRect.width / 2;
      const tooltipRightEdge = currentLeft + tooltipRect.width / 2;

      let needsAdjustment = false;
      let finalLeft = currentLeft;
      let finalTop = currentTop;

      // Kiểm tra xem tooltip có đè lên element không
      // Chỉ điều chỉnh nếu thực sự đè lên (overlap đáng kể)
      if (step.position === 'left') {
        // Kiểm tra tooltip có đè lên element bên trái không
        // Chỉ điều chỉnh nếu tooltip right edge vượt quá target left edge - minDistance
        const overlap = tooltipRightEdge - (targetRect.left - minDistance);
        if (overlap > 10) {
          // Chỉ điều chỉnh nếu overlap > 10px
          needsAdjustment = true;
          // Đẩy tooltip sang trái
          finalLeft = targetRect.left - minDistance - tooltipRect.width / 2;
        }
      } else if (step.position === 'right') {
        // Kiểm tra tooltip có đè lên element bên phải không
        const overlap = targetRect.right + minDistance - tooltipLeftEdge;
        if (overlap > 10) {
          // Chỉ điều chỉnh nếu overlap > 10px
          needsAdjustment = true;
          // Đẩy tooltip sang phải
          finalLeft = targetRect.right + minDistance + tooltipRect.width / 2;
        }
      }

      // Kiểm tra tooltip có tràn ra ngoài viewport không
      const halfWidth = tooltipRect.width / 2;
      const halfHeight = tooltipRect.height / 2;

      // Chỉ điều chỉnh viewport nếu thực sự tràn ra ngoài đáng kể
      if (finalLeft - halfWidth < padding) {
        const overflow = padding - (finalLeft - halfWidth);
        if (overflow > 5) {
          // Chỉ điều chỉnh nếu overflow > 5px
          needsAdjustment = true;
          finalLeft = padding + halfWidth;
          // Nếu vẫn đè lên element, đặt ở bên phải
          if (
            step.position === 'left' &&
            finalLeft + halfWidth > targetRect.left - minDistance
          ) {
            finalLeft = targetRect.right + minDistance + halfWidth;
          }
        }
      } else if (finalLeft + halfWidth > viewportWidth - padding) {
        const overflow = finalLeft + halfWidth - (viewportWidth - padding);
        if (overflow > 5) {
          // Chỉ điều chỉnh nếu overflow > 5px
          needsAdjustment = true;
          finalLeft = viewportWidth - padding - halfWidth;
          // Nếu vẫn đè lên element, đặt ở bên trái
          if (
            step.position === 'right' &&
            finalLeft - halfWidth < targetRect.right + minDistance
          ) {
            finalLeft = targetRect.left - minDistance - halfWidth;
          }
        }
      }

      if (finalTop - halfHeight < padding) {
        needsAdjustment = true;
        finalTop = padding + halfHeight;
      } else if (finalTop + halfHeight > viewportHeight - padding) {
        needsAdjustment = true;
        finalTop = viewportHeight - padding - halfHeight;
      }

      // Chỉ cập nhật nếu thực sự cần điều chỉnh và khác biệt đáng kể
      if (needsAdjustment) {
        const leftDiff = Math.abs(finalLeft - currentLeft);
        const topDiff = Math.abs(finalTop - currentTop);
        const threshold = 5; // Chỉ update nếu khác nhau > 5px

        if (leftDiff > threshold || topDiff > threshold) {
          tooltip.style.left = `${finalLeft}px`;
          tooltip.style.top = `${finalTop}px`;
        }
      }
    };

    // Điều chỉnh sau khi render (delay để đảm bảo tooltip đã render xong)
    const timeout = setTimeout(adjustPosition, 150);

    // Cũng điều chỉnh khi resize
    window.addEventListener('resize', adjustPosition);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', adjustPosition);
    };
  }, [tooltipPosition, step]);

  // Hiển thị completion banner
  if (showCompletionBanner) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] pointer-events-auto">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center z-[10000]">
          <div
            className="rounded-lg shadow-2xl p-8 min-w-[400px] max-w-[500px]"
            style={{
              backgroundColor: '#2B2D31',
              color: '#F2F3F5',
              border: '1px solid #3F4246'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-[#5865F2]" />
              </div>
            </div>
            <h3
              className="text-2xl font-semibold text-center mb-3"
              style={{ color: '#F2F3F5' }}
            >
              Hoàn thành! 🎉
            </h3>
            <p
              className="text-base text-center mb-6 leading-relaxed"
              style={{ color: '#B5BAC1' }}
            >
              Bạn đã sẵn sàng sử dụng hệ thống! Chúc bạn trải nghiệm tốt.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={onDismissBanner}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Bắt đầu sử dụng
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!isActive) return null;

  // Nếu không có step, vẫn hiển thị overlay nhưng không có tooltip
  if (!step) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay với dimming */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightRect.left}px 100%, 
                ${highlightRect.left}px ${highlightRect.top}px, 
                ${highlightRect.right}px ${highlightRect.top}px, 
                ${highlightRect.right}px ${highlightRect.bottom}px, 
                ${highlightRect.left}px ${highlightRect.bottom}px, 
                ${highlightRect.left}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : undefined
        }}
      />

      {/* Highlight border */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none z-[9998]"
          style={{
            left: `${highlightRect.left - 4}px`,
            top: `${highlightRect.top - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`,
            border: '3px solid #5865F2',
            borderRadius: '8px',
            boxShadow:
              '0 0 0 9999px rgba(88, 101, 242, 0.1), 0 0 20px rgba(88, 101, 242, 0.5)'
          }}
        />
      )}

      {/* Tooltip - hiển thị khi có position hoặc đang tìm element */}
      {step.target !== 'body' && (
        <div
          ref={tooltipRef}
          className="fixed pointer-events-auto z-[10000]"
          style={{
            top: tooltipPosition ? `${tooltipPosition.top}px` : '50%',
            left: tooltipPosition ? `${tooltipPosition.left}px` : '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: 'min(400px, calc(100vw - 40px))',
            maxHeight: 'min(500px, calc(100vh - 40px))'
          }}
        >
          <div
            className="rounded-lg shadow-2xl p-6"
            style={{
              backgroundColor: '#2B2D31',
              color: '#F2F3F5',
              border: '1px solid #3F4246',
              minWidth: '280px',
              maxWidth: 'min(400px, calc(90vw - 40px))',
              width: 'auto'
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3
                className="text-lg font-semibold"
                style={{ color: '#F2F3F5' }}
              >
                {step.title}
              </h3>
              <button
                onClick={onSkip}
                className="transition-colors hover:opacity-80"
                style={{ color: '#B5BAC1' }}
                aria-label="Bỏ qua tour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: '#B5BAC1' }}
            >
              {step.content}
            </p>

            {/* Footer với buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-6 bg-[#5865F2]'
                        : 'w-1.5 bg-[#3F4246]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    onClick={onPrev}
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-[#3F4246] text-[#B5BAC1] hover:bg-[#4752C4] hover:text-white hover:border-[#4752C4]"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                )}

                <Button
                  onClick={isLastStep ? onFinish : onNext}
                  size="sm"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Hoàn thành
                    </>
                  ) : (
                    <>
                      Tiếp theo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome modal (center) */}
      {step.target === 'body' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[10000]">
          <div
            className="rounded-lg shadow-2xl p-8 min-w-[400px] max-w-[500px]"
            style={{
              backgroundColor: '#2B2D31',
              color: '#F2F3F5',
              border: '1px solid #3F4246'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3
                className="text-2xl font-semibold"
                style={{ color: '#F2F3F5' }}
              >
                {step.title}
              </h3>
              <button
                onClick={onSkip}
                className="transition-colors hover:opacity-80"
                style={{ color: '#B5BAC1' }}
                aria-label="Bỏ qua tour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p
              className="text-base mb-8 leading-relaxed"
              style={{ color: '#B5BAC1' }}
            >
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={onSkip}
                className="transition-colors hover:opacity-80 text-sm"
                style={{ color: '#B5BAC1' }}
              >
                Bỏ qua tour
              </button>

              <Button
                onClick={onNext}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Bắt đầu tour
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

function calculateTooltipPosition(
  rect: DOMRect,
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
): { top: number; left: number } {
  const padding = 20;
  const tooltipHeight = 250; // Estimated
  const tooltipWidth = 400; // Estimated
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // clamp helper để không tràn màn hình
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  switch (position) {
    case 'top': {
      // centerY nằm phía trên rect, không đè lên
      const centerY = rect.top - padding - tooltipHeight / 2;
      const centerX = rect.left + rect.width / 2;
      return {
        top: clamp(
          centerY,
          tooltipHeight / 2 + padding,
          viewportHeight - tooltipHeight / 2 - padding
        ),
        left: clamp(
          centerX,
          tooltipWidth / 2 + padding,
          viewportWidth - tooltipWidth / 2 - padding
        )
      };
    }

    case 'bottom': {
      // centerY nằm phía dưới rect, không đè lên
      const centerY = rect.bottom + padding + tooltipHeight / 2;
      const centerX = rect.left + rect.width / 2;
      return {
        top: clamp(
          centerY,
          tooltipHeight / 2 + padding,
          viewportHeight - tooltipHeight / 2 - padding
        ),
        left: clamp(
          centerX,
          tooltipWidth / 2 + padding,
          viewportWidth - tooltipWidth / 2 - padding
        )
      };
    }

    case 'left': {
      // Padding lớn để tooltip không che mất highlight
      const leftPadding = 40; // Khoảng cách tối thiểu từ left edge của element

      // Tính toán vị trí: tooltip center = left edge - padding - một nửa tooltip width
      // Với transform -50%, right edge của tooltip sẽ ở left edge - padding
      const tooltipCenterX = rect.left - leftPadding - tooltipWidth / 2;
      const centerY = rect.top + rect.height / 2;

      // Kiểm tra nếu không đủ chỗ ở bên trái
      if (tooltipCenterX - tooltipWidth / 2 < padding) {
        // Nếu không đủ chỗ bên trái, kiểm tra bên phải
        const rightSpace = viewportWidth - rect.right;
        if (rightSpace > tooltipWidth + leftPadding) {
          // Đặt ở right nếu có đủ chỗ
          return {
            top: clamp(
              centerY,
              tooltipHeight / 2 + padding,
              viewportHeight - tooltipHeight / 2 - padding
            ),
            left: clamp(
              rect.right + leftPadding + tooltipWidth / 2,
              tooltipWidth / 2 + padding,
              viewportWidth - tooltipWidth / 2 - padding
            )
          };
        } else {
          // Không đủ chỗ cả 2 bên, đặt ở giữa viewport nhưng vẫn cố gắng nằm bên trái
          return {
            top: clamp(
              centerY,
              tooltipHeight / 2 + padding,
              viewportHeight - tooltipHeight / 2 - padding
            ),
            left: clamp(
              padding + tooltipWidth / 2,
              rect.left - leftPadding - tooltipWidth / 2,
              viewportWidth - tooltipWidth / 2 - padding
            )
          };
        }
      }

      // Đủ chỗ bên trái, đặt tooltip ở đó
      return {
        top: clamp(
          centerY,
          tooltipHeight / 2 + padding,
          viewportHeight - tooltipHeight / 2 - padding
        ),
        left: clamp(
          tooltipCenterX,
          tooltipWidth / 2 + padding,
          viewportWidth - tooltipWidth / 2 - padding
        )
      };
    }

    case 'right': {
      const centerX = rect.right + padding + tooltipWidth / 2;
      const centerY = rect.top + rect.height / 2;
      return {
        top: clamp(
          centerY,
          tooltipHeight / 2 + padding,
          viewportHeight - tooltipHeight / 2 - padding
        ),
        left: clamp(
          centerX,
          tooltipWidth / 2 + padding,
          viewportWidth - tooltipWidth / 2 - padding
        )
      };
    }

    case 'center':
    default:
      return {
        top: viewportHeight / 2,
        left: viewportWidth / 2
      };
  }
}
