"""
Payment service placeholder.

This module will handle payment gateway integration for Iranian gateways
such as ZarinPal or IDPay.

TODO: Implement when payment is required:
      - Purchase gym subscriptions / plans
      - Verify payment callbacks
      - Handle refunds
      - Store transaction records

      Suggested structure:
      ```
      class PaymentGateway(ABC):
          async def request_payment(self, amount: int, callback_url: str) -> PaymentRequestResult: ...
          async def verify_payment(self, authority: str, amount: int) -> PaymentVerifyResult: ...

      class ZarinPalGateway(PaymentGateway): ...
      class IDPayGateway(PaymentGateway): ...
      ```
"""

from dataclasses import dataclass


@dataclass
class PaymentRequestResult:
    authority: str
    redirect_url: str


@dataclass
class PaymentVerifyResult:
    ref_id: str
    success: bool


# Placeholder — will be replaced with actual gateway implementation
def get_payment_gateway():
    """Return the configured payment gateway instance.

    TODO: Replace with real gateway selection based on config.
    """
    raise NotImplementedError("Payment gateway not yet configured")