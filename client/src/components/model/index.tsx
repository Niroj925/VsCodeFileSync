import { useProjectContext } from "../../contexts/ProjectContext";
import ApiKeyModal from "./ApiKeyModel";
import ProviderModel from "./ProviderModel";

const Model: React.FC = () => {
  const {
    isOpenApiKeyModal,
    isOpenProviderModal,
    setIsOpenProviderModal,
    setIsOpenApiKeyModal,
  } = useProjectContext();

  return (
    <div>
      {isOpenApiKeyModal && (
        <ApiKeyModal
          open={isOpenApiKeyModal}
          onClose={() => setIsOpenApiKeyModal(false)}
        />
      )}
      {isOpenProviderModal && (
        <ProviderModel
          open={isOpenProviderModal}
          onClose={() => setIsOpenProviderModal(false)}
        />
      )}
    </div>
  );
};

export default Model;
