import { SubmissionSectionAccessesComponent } from './accesses/section-accesses.component';
import { SubmissionSectionCcLicensesComponent } from './cc-license/submission-section-cc-licenses.component';
import { SubmissionSectionClarinLicenseDistributionComponent } from './clarin-license-distribution/clarin-license-distribution.component';
import { SubmissionSectionClarinLicenseComponent } from './clarin-license-resource/section-license.component';
import { SubmissionSectionClarinNoticeComponent } from './clarin-notice/clarin-notice.component';
import { SubmissionSectionDuplicatesComponent } from './duplicates/section-duplicates.component';
import { SubmissionSectionFormComponent } from './form/section-form.component';
import { SubmissionSectionIdentifiersComponent } from './identifiers/section-identifiers.component';
import { SubmissionSectionCoarNotifyComponent } from './section-coar-notify/section-coar-notify.component';
import { SectionsType } from './sections-type';
import { SubmissionSectionSherpaPoliciesComponent } from './sherpa-policies/section-sherpa-policies.component';
import { SubmissionSectionUploadComponent } from './upload/section-upload.component';

const submissionSectionsMap = new Map();

submissionSectionsMap.set(SectionsType.AccessesCondition, SubmissionSectionAccessesComponent);
// CLARIN: override the vanilla License section with the distribution-license variant (ng-toggle
// acceptance + help-desk link). The matching e2e specs (submission/my-dspace) interact with the
// ng-toggle (ds-clarin-license-distribution ng-toggle) instead of the vanilla #granted checkbox.
submissionSectionsMap.set(SectionsType.License, SubmissionSectionClarinLicenseDistributionComponent);
submissionSectionsMap.set(SectionsType.CcLicense, SubmissionSectionCcLicensesComponent);
submissionSectionsMap.set(SectionsType.SherpaPolicies, SubmissionSectionSherpaPoliciesComponent);
submissionSectionsMap.set(SectionsType.Upload, SubmissionSectionUploadComponent);
submissionSectionsMap.set(SectionsType.SubmissionForm, SubmissionSectionFormComponent);
submissionSectionsMap.set(SectionsType.Identifiers, SubmissionSectionIdentifiersComponent);
submissionSectionsMap.set(SectionsType.CoarNotify, SubmissionSectionCoarNotifyComponent);
submissionSectionsMap.set(SectionsType.Duplicates, SubmissionSectionDuplicatesComponent);
// CLARIN submission sections
submissionSectionsMap.set(SectionsType.clarinNotice, SubmissionSectionClarinNoticeComponent);
submissionSectionsMap.set(SectionsType.clarinLicense, SubmissionSectionClarinLicenseComponent);

/**
 * @deprecated
 */
export function renderSectionFor(sectionType: SectionsType) {
  return function decorator(objectElement: any) {
    if (!objectElement) {
      return;
    }
    submissionSectionsMap.set(sectionType, objectElement);
  };
}

export function rendersSectionType(sectionType: SectionsType) {
  return submissionSectionsMap.get(sectionType);
}
