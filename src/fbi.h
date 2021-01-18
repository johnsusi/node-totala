#pragma once
#ifndef __TA_FBI_H__
#define __TA_FBI_H__

#include <memory>

class TAFBIFile
{

  TAFBIFile(const std::string& input);
  ~TAFBIFile();

private:
  struct impl;
  std::unique_ptr<impl> _pimpl;
};


#endif